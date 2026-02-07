import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "config"

function docToInstance(document) {
	let data = document.data()
	return data ? new Settings(
		document.id, 
		data.downgradeCost, 
		data.upgradeCost, 
		data.rarityPoints, 
		data.rarityCash, 
		data.collectionMultiplier, 
		data.dailyBonus, 
		data.rarityDropRates,
		data.typeDropRates,
		data.welcomeBonus,
    data.raritySoul,
    data.soulPoints
	) : null
}

class Settings {
	constructor(id, downgradeCost, upgradeCost, rarityPoints, rarityCash, collectionMultiplier, dailyBonus, rarityDropRates, typeDropRates, welcomeBonus, raritySoul, soulPoints) {
		this.id = id
		this.downgradeCost = downgradeCost !== undefined ? downgradeCost : 1
		this.upgradeCost = upgradeCost !== undefined ? upgradeCost : 5
		this.rarityPoints = rarityPoints || {
			common: 10,
			silver: 50,
			golden: 200,
			foil: 1000
		}
		this.rarityCash = rarityCash || {
			common: { common: 5, silver: 30, golden: 180, foil: 1000 },
			uncommon: { common: 10, silver: 60, golden: 360, foil: 2000 },
			rare: { common: 20, silver: 120, golden: 720, foil: 4000 },
			mythic: { common: 50, silver: 300, golden: 1800, foil: 10000 }
		}
    this.raritySoul = raritySoul || {
      common: 1,
      uncommon: 3,
      rare: 5,
      mythic: 10
    }
    this.soulPoints = soulPoints !== undefined ? soulPoints : 100

		// Migration old format (single object) to new format (double entry)
		if (this.rarityCash && typeof this.rarityCash.common === 'number') {
			const oldValues = { ...this.rarityCash }
			this.rarityCash = {
				common: { ...oldValues },
				uncommon: { ...oldValues },
				rare: { ...oldValues },
				mythic: { ...oldValues }
			}
		}
		this.collectionMultiplier = collectionMultiplier !== undefined ? collectionMultiplier : 0.1
		this.dailyBonus = dailyBonus !== undefined ? dailyBonus : 100
		this.welcomeBonus = welcomeBonus !== undefined ? welcomeBonus : 100
    this.rarityDropRates = rarityDropRates || {
      silver: 10,
      golden: 5,
      foil: 1
    }
		this.typeDropRates = typeDropRates || {
			common: 4,
			uncommon: 3,
			rare: 2,
			mythic: 1
		}
	}

	static async getAll() {
		const documents = await getDocs(collection(db, collectionName))
		return documents.docs.map(docToInstance)
	}

	static async getById(id) {
		const document = await getDoc(doc(db, collectionName, id))
		return docToInstance(document)
	}

	static async listenAll(callback) {
		return onSnapshot(collection(db, collectionName), (snapshot) => {
			const list = []
			snapshot.forEach((doc) => {
				list.push(docToInstance(doc))
			})
			callback(list)
		})
	}

	static async listenById(id, callback) {
		return onSnapshot(doc(db, collectionName, id), (snapshot) => {
			callback(docToInstance(snapshot))
		})
	}

	async save() {
		const new_doc = {
			downgradeCost: this.downgradeCost,
			upgradeCost: this.upgradeCost,
			rarityPoints: this.rarityPoints,
			rarityCash: this.rarityCash,
			collectionMultiplier: this.collectionMultiplier,
			dailyBonus: this.dailyBonus,
			welcomeBonus: this.welcomeBonus,
			rarityDropRates: this.rarityDropRates,
			typeDropRates: this.typeDropRates,
      raritySoul: this.raritySoul,
      soulPoints: this.soulPoints
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			this.id = "general"
			await setDoc(doc(db, collectionName, this.id), new_doc)
		}
		return true
	}

	async delete() {
		if (this.id) {
			await deleteDoc(doc(db, collectionName, this.id))
		}
		return true
	}
}

export default Settings
