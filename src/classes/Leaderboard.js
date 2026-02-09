import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import Profile from "./Profile.js"
import Card from "./Card.js"
import Collection from "./Collection.js"
import Settings from "./Settings.js"
import achievementsData from "@/data/achievements.json"
import notifManager from "@/assets/functions/notifManager.js"
import blacklistData from "@/data/leaderboardBlacklist.json"

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
		if (data && now - data.updatedAt < 10 * 60 * 1000) {
			return new Leaderboard(data.updatedAt, data.players)
		}

		// Otherwise recalculate
		return await this.recalculate()
	}

	static async recalculate() {
		// Fetch specific data needed for calculation
		const [cards, allCollections, profiles, settings] = await Promise.all([Card.getAll(), Collection.getAll(), Profile.getAll(), Settings.getById("general")])

		const collections = allCollections.filter((c) => c.isPublic && !blacklistData.includes(c.id))

		const pointsConfig = {
			common: settings.rarityPoints.common,
			silver: settings.rarityPoints.silver,
			gold: settings.rarityPoints.golden,
			foil: settings.rarityPoints.foil,
			souls: settings.soulPoints || 100,
		}

		const players = profiles
			.filter((profile) => {
				if (!profile.activated) return false
				if (profile.stats && profile.stats.public === false) return false
				return true
			})
			.map((profile) => {
				const stats = this.calculatePlayerStats(profile, cards, collections, achievementsData, settings, pointsConfig)
				return stats
			})

		// Sort by score descending
		players.sort((a, b) => b.score - a.score)

		// Check for Rank Achievements
		for (let i = 0; i < players.length; i++) {
			if (i >= 10) break
			const playerStats = players[i]
			const profile = profiles.find((p) => p.id === playerStats.id)

			if (profile) {
				let changes = false
				if (!profile.achievements) profile.achievements = {}

				// Top 10
				if (i < 10 && !profile.achievements["top_10_collectionneurs"]) {
					profile.achievements["top_10_collectionneurs"] = true
					notifManager.sendAchievementNotif(profile.id, "top_10_collectionneurs", "Vous avez atteint le top 10 du classement !")
					changes = true
				}
				// Top 5
				if (i < 5 && !profile.achievements["top_5_collectionneurs"]) {
					profile.achievements["top_5_collectionneurs"] = true
					notifManager.sendAchievementNotif(profile.id, "top_5_collectionneurs", "Vous avez atteint le top 5 du classement !")
					changes = true
				}
				// Top 3
				if (i < 3 && !profile.achievements["top_3_collectionneurs"]) {
					profile.achievements["top_3_collectionneurs"] = true
					notifManager.sendAchievementNotif(profile.id, "top_3_collectionneurs", "Vous avez atteint le top 3 du classement !")
					changes = true
				}
				// Top 1
				if (i === 0 && !profile.achievements["le_roi_des_collectionneurs"]) {
					profile.achievements["le_roi_des_collectionneurs"] = true
					notifManager.sendAchievementNotif(profile.id, "le_roi_des_collectionneurs", "Vous avez atteint la première place du classement !")
					changes = true
				}

				if (changes) {
					await profile.save()
				}
			}
		}

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
			const cardDef = allCards.find((c) => c.id === cardId)
			if (!cardDef) return

			// Verify the card belongs to a valid (public) collection
			const collectionDef = allCollections.find((c) => c.id === cardDef.collection)
			if (!collectionDef || blacklistData.includes(collectionDef.id)) return

			if (!profile.collections || !profile.collections[cardDef.collection]) return

			if (cardData.common > 0) cardCounts.common++
			if (cardData.silver > 0) cardCounts.silver++
			if ((cardData.golden || cardData.gold) > 0) cardCounts.gold++
			if (cardData.foil > 0) cardCounts.foil++
		})

		// --- 2. Collection Completion ---
		allCollections.forEach((collection) => {
			if (blacklistData.includes(collection.id)) return
			if (!profile.collections || !profile.collections[collection.id]) return

			const collectionCardIds = allCards.filter((c) => c.collection === collection.id).map((c) => c.id)

			if (collectionCardIds.length === 0) return

			const isComplete = (rarityKey) => {
				return collectionCardIds.every((cardId) => {
					const owned = userCards[cardId]
					const key = rarityKey === "gold" ? "golden" : rarityKey
					return owned && owned[key] > 0
				})
			}

			if (isComplete("common")) completed.common++
			if (isComplete("silver")) completed.silver++
			if (isComplete("gold")) completed.gold++
			if (isComplete("foil")) completed.foil++
		})

		// --- 3. Achievement Points ---
		let achievementPoints = 0
		if (profile.achievements) {
			achievementsData.forEach((ach) => {
				if (profile.achievements[ach.id] === true) {
					achievementPoints += ach.points
				}
			})
		}

		// --- 4. Score Calculation ---
		const getMultiplier = (type) => 1 + (completed[type] || 0) * settings.collectionMultiplier

		let soulsScore = 0
		const souls = profile.souls || 0
		if (souls > 0) {
			soulsScore = (Math.floor(Math.log2(souls)) + 1) * pointsConfig.souls
		}

		const score = cardCounts.common * pointsConfig.common * getMultiplier("common") + cardCounts.silver * pointsConfig.silver * getMultiplier("silver") + cardCounts.gold * pointsConfig.gold * getMultiplier("gold") + cardCounts.foil * pointsConfig.foil * getMultiplier("foil") + soulsScore + achievementPoints

		return {
			id: profile.id,
			name: profile.name || "Joueur Inconnu",
			// isCurrentUser checked in View using ID
			achievementPoints: achievementPoints,
			cards: cardCounts,
			souls: profile.souls || 0,
      soulsScore: soulsScore,
			completedCollections: completed,
			score: score,
			multipliers: {
				common: getMultiplier("common"),
				silver: getMultiplier("silver"),
				gold: getMultiplier("gold"),
				foil: getMultiplier("foil"),
			},
		}
	}

	async save() {
		await setDoc(docRef, {
			updatedAt: this.updatedAt,
			players: this.players,
		})
	}
}

export default Leaderboard
