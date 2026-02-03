import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import Profile from './Profile.js'
import Card from './Card.js'
import Collection from './Collection.js'
import Settings from './Settings.js'
import achievementsData from '@/data/achievements.json'

const db = getFirestore()
const docRef = doc(db, "general", "leaderboard")

class Leaderboard {
    constructor(updatedAt, players) {
        this.updatedAt = updatedAt || 0
        this.players = players || []
    }

    static async getOrUpdate() {
        const snapshot = await getDoc(docRef)
        const data = snapshot.exists() ? snapshot.data() : null

        const now = Date.now()
        // Check if data exists and is fresh (less than 10 minutes old)
        if (data && (now - data.updatedAt < 10 * 60 * 1000)) {
            return new Leaderboard(data.updatedAt, data.players)
        }

        // Otherwise recalculate
        return await this.recalculate()
    }

    static async recalculate() {
        // Fetch specific data needed for calculation
        const [cards, collections, profiles, settings] = await Promise.all([
            Card.getAll(),
            Collection.getAll(),
            Profile.getAll(),
            Settings.getById("general")
        ])

        const pointsConfig = {
            common: settings.rarityPoints.common,
            silver: settings.rarityPoints.silver,
            gold: settings.rarityPoints.golden,
            foil: settings.rarityPoints.foil
        }

        const players = profiles
            .filter(profile => {
                if (!profile.activated) return false
                if (profile.stats && profile.stats.public === false) return false
                return true
            })
            .map(profile => {
                const stats = this.calculatePlayerStats(profile, cards, collections, achievementsData, settings, pointsConfig)
                return stats
            })

        // Sort by score descending
        players.sort((a, b) => b.score - a.score)

        const leaderboard = new Leaderboard(Date.now(), players)
        await leaderboard.save()
        return leaderboard
    }

    static calculatePlayerStats(profile, allCards, allCollections, achievementsData, settings, pointsConfig) {
        const userCards = profile.cards || {}
        const cardCounts = { common: 0, silver: 0, gold: 0, foil: 0 }
        const completed = { common: 0, silver: 0, gold: 0, foil: 0 }

        // --- 1. Unique Card Counts ---
        Object.entries(userCards).forEach(([cardId, cardData]) => {
            const cardDef = allCards.find(c => c.id === cardId)
            if (!cardDef) return

            if (!profile.collections || !profile.collections[cardDef.collection]) return

            if (cardData.common > 0) cardCounts.common++
            if (cardData.silver > 0) cardCounts.silver++
            if ((cardData.golden || cardData.gold) > 0) cardCounts.gold++
            if (cardData.foil > 0) cardCounts.foil++
        })

        // --- 2. Collection Completion ---
        allCollections.forEach(collection => {
            if (!profile.collections || !profile.collections[collection.id]) return

            const collectionCardIds = allCards
                .filter(c => c.collection === collection.id)
                .map(c => c.id)

            if (collectionCardIds.length === 0) return

            const isComplete = (rarityKey) => {
                return collectionCardIds.every(cardId => {
                    const owned = userCards[cardId]
                    const key = rarityKey === 'gold' ? 'golden' : rarityKey
                    return owned && owned[key] > 0
                })
            }

            if (isComplete('common')) completed.common++
            if (isComplete('silver')) completed.silver++
            if (isComplete('gold')) completed.gold++
            if (isComplete('foil')) completed.foil++
        })

        // --- 3. Achievement Points ---
        let achievementPoints = 0
        if (profile.achievements) {
            achievementsData.forEach(ach => {
                if (profile.achievements[ach.id] === true) {
                    achievementPoints += ach.points
                }
            })
        }

        // --- 4. Score Calculation ---
        const getMultiplier = (type) => 1 + ((completed[type] || 0) * settings.collectionMultiplier)

        const score = (cardCounts.common * pointsConfig.common * getMultiplier('common')) +
            (cardCounts.silver * pointsConfig.silver * getMultiplier('silver')) +
            (cardCounts.gold * pointsConfig.gold * getMultiplier('gold')) +
            (cardCounts.foil * pointsConfig.foil * getMultiplier('foil')) +
            achievementPoints

        return {
            id: profile.id,
            name: profile.name || 'Joueur Inconnu',
            // isCurrentUser checked in View using ID
            achievementPoints: achievementPoints,
            cards: cardCounts,
            completedCollections: completed,
            score: score,
            multipliers: {
                common: getMultiplier('common'),
                silver: getMultiplier('silver'),
                gold: getMultiplier('gold'),
                foil: getMultiplier('foil')
            }
        }
    }

    async save() {
        await setDoc(docRef, {
            updatedAt: this.updatedAt,
            players: this.players
        })
    }
}

export default Leaderboard
