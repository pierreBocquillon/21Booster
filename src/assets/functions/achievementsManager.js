import { useUserStore } from "@/store/user.js"
import achievementsData from "@/data/achievements.json"
import Card from "@/classes/Card.js"
import notifManager from "@/assets/functions/notifManager.js"

let cachedCards = null

let achievementsManager = {
	async checkForAchievements() {
		const userStore = useUserStore()
		if (!userStore.profile) return

		const profile = userStore.profile
		const stats = profile.stats || {}
		const cards = profile.cards || {}
		const codes = profile.codes || {}
		let changes = false

		// Initialize achievements map if missing
		if (!profile.achievements) {
			profile.achievements = {}
			changes = true
		}

		// Fetch card definitions for collection checks (with cache)
		if (!cachedCards) {
			cachedCards = await Card.getAll()
		}
		const allCardsList = cachedCards

		// 1. Pre-calculate Aggregates
		let totalCards = { common: 0, silver: 0, golden: 0, foil: 0 }

		Object.entries(cards).forEach(([cardId, c]) => {
			const cardDef = allCardsList.find((def) => def.id === cardId)
			if (!cardDef) return

			// Skip if collection is not owned/unlocked
			if (!profile.collections || !profile.collections[cardDef.collection]) return

			totalCards.common += c.common || 0
			totalCards.silver += c.silver || 0
			totalCards.golden += c.golden || 0
			totalCards.foil += c.foil || 0
		})

		const totalCodes = Object.keys(codes).length

		// Group definitions by collection
		const collectionDefs = {}
		allCardsList.forEach((c) => {
			if (!collectionDefs[c.collection]) collectionDefs[c.collection] = []
			collectionDefs[c.collection].push(c.id)
		})

		// Check completeness
		let builtCollections = { common: 0, silver: 0, golden: 0, foil: 0, all: 0 }

		for (const [colName, cardIds] of Object.entries(collectionDefs)) {
			// Skip if collection is not owned/unlocked
			if (!profile.collections || !profile.collections[colName]) continue

			let isCommon = true
			let isSilver = true
			let isGolden = true
			let isFoil = true
			let isAll = true // Master completion

			if (cardIds.length === 0) continue

			for (const cid of cardIds) {
				const owned = cards[cid] || { common: 0, silver: 0, golden: 0, foil: 0 }
				if (owned.common <= 0) isCommon = false
				if (owned.silver <= 0) isSilver = false
				if (owned.golden <= 0) isGolden = false
				if (owned.foil <= 0) isFoil = false

				if (owned.common <= 0 || owned.silver <= 0 || owned.golden <= 0 || owned.foil <= 0) isAll = false
			}

			if (isCommon) builtCollections.common++
			if (isSilver) builtCollections.silver++
			if (isGolden) builtCollections.golden++
			if (isFoil) builtCollections.foil++
			if (isAll) builtCollections.all++
		}

		// 2. Iterate Achievements
		achievementsData.forEach((ach) => {
			if (profile.achievements[ach.id]) return // Already unlocked

			let unlocked = false

			switch (ach.id) {
				// Boosters
				case "collectionneur_debutant":
					unlocked = (stats.open || 0) >= 1
					break
				case "collectionneur_averti":
					unlocked = (stats.open || 0) >= 10
					break
				case "collectionneur_expert":
					unlocked = (stats.open || 0) >= 50
					break
				case "collectionneur_legendaire":
					unlocked = (stats.open || 0) >= 100
					break

				// Cards Count
				case "je_veux_une_carte_classique":
					unlocked = totalCards.common >= 1
					break
				case "je_veux_une_carte_argent":
					unlocked = totalCards.silver >= 1
					break
				case "je_veux_une_carte_doree":
					unlocked = totalCards.golden >= 1
					break
				case "je_veux_une_carte_foil":
					unlocked = totalCards.foil >= 1
					break

				case "encore_une_carte_classique":
					unlocked = totalCards.common >= 10
					break
				case "encore_une_carte_argent":
					unlocked = totalCards.silver >= 10
					break
				case "encore_une_carte_doree":
					unlocked = totalCards.golden >= 10
					break
				case "encore_une_carte_foil":
					unlocked = totalCards.foil >= 10
					break

				case "toujours_plus_de_cartes_classiques":
					unlocked = totalCards.common >= 50
					break
				case "toujours_plus_de_cartes_argent":
					unlocked = totalCards.silver >= 50
					break
				case "toujours_plus_de_cartes_dorees":
					unlocked = totalCards.golden >= 50
					break
				case "toujours_plus_de_cartes_foil":
					unlocked = totalCards.foil >= 50
					break

				// Codes
				case "un_petit_cadeau":
					unlocked = totalCodes >= 1
					break
				case "cadeau_utile":
					unlocked = totalCodes >= 3
					break
				case "cadeau_genereux":
					unlocked = totalCodes >= 5
					break
				case "cadeau_luxueux":
					unlocked = totalCodes >= 10
					break

				// Sacrifice
				case "croc_mort":
					unlocked = (stats.destroy || 0) >= 1
					break
				case "gardien_de_la_crypte":
					unlocked = (stats.destroy || 0) >= 10
					break
				case "maitre_necromancien":
					unlocked = (stats.destroy || 0) >= 50
					break
				case "seigneur_des_morts":
					unlocked = (stats.destroy || 0) >= 100
					break

				// Upgrade
				case "apprenti_forgeron":
					unlocked = (stats.upgrades || 0) >= 1
					break
				case "maitre_forgeron":
					unlocked = (stats.upgrades || 0) >= 10
					break
				case "grand_armurier":
					unlocked = (stats.upgrades || 0) >= 50
					break
				case "dieu_de_la_forge":
					unlocked = (stats.upgrades || 0) >= 100
					break

				// Downgrade
				case "la_poubelle_jaune":
					unlocked = (stats.downgrades || 0) >= 1
					break
				case "station_d_epuration":
					unlocked = (stats.downgrades || 0) >= 10
					break
				case "usine_de_gestion_des_dechets":
					unlocked = (stats.downgrades || 0) >= 50
					break
				case "dieu_du_recyclage":
					unlocked = (stats.downgrades || 0) >= 100
					break

				// Collections
				case "addiction_aux_classiques":
					unlocked = builtCollections.common >= 1
					break
				case "addiction_a_l_argent":
					unlocked = builtCollections.silver >= 1
					break
				case "addiction_a_l_or":
					unlocked = builtCollections.golden >= 1
					break
				case "addiction_aux_foil":
					unlocked = builtCollections.foil >= 1
					break

				case "chasseur_de_tresors":
					unlocked = builtCollections.all >= 1
					break

				default:
					break
			}

			if (unlocked) {
				profile.achievements[ach.id] = true
				notifManager.sendAchievementNotif(profile.id, ach.id, `Vous avez obtenues le succès "${ach.title}" !`)
				changes = true
			}
		})

		if (changes) {
			await profile.save()
		}
		return true
	},
}

export default achievementsManager
