import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"
import Profile from './Profile.js'
import achievementsData from '@/data/achievements.json'

const db = getFirestore()
const docRef = doc(db, "general", "achievementStats")

class AchievementStats {
    constructor(updatedAt, rates) {
        this.updatedAt = updatedAt || 0
        this.rates = rates || {}
    }

    static async getOrUpdate() {
        const snapshot = await getDoc(docRef)
        const data = snapshot.exists() ? snapshot.data() : null

        const now = Date.now()
        // Check if data exists and is fresh (less than 10 minutes old)
        if (data && (now - data.updatedAt < 10 * 60 * 1000)) {
            return new AchievementStats(data.updatedAt, data.rates)
        }

        // Otherwise recalculate
        return await this.recalculate()
    }

    static async recalculate() {
        const profiles = await Profile.getAll()
        
        // Filter valid profiles for statistics
        const validProfiles = profiles.filter(p => !p.activated === false && p.stats?.public !== false)
        const totalProfiles = validProfiles.length

        const rates = {}

        if (totalProfiles > 0) {
            achievementsData.forEach(ach => {
                const count = validProfiles.filter(p => p.achievements && p.achievements[ach.id] === true).length
                const percentage = Math.round((count / totalProfiles) * 100)
                rates[ach.id] = percentage + '%'
            })
        } else {
            achievementsData.forEach(ach => {
                rates[ach.id] = '0%'
            })
        }

        const stats = new AchievementStats(Date.now(), rates)
        await stats.save()
        return stats
    }

    async save() {
        await setDoc(docRef, {
            updatedAt: this.updatedAt,
            rates: this.rates
        })
    }
}

export default AchievementStats
