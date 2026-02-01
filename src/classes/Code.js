import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "codes"

function docToInstance(document) {
	let data = document.data()
	if (!data) return null

	// Backward compatibility
	let collections = data.collections || []
	if (data.collection && !collections.includes(data.collection)) collections.push(data.collection)

	let cards = data.cards || []
	if (data.card) {
		cards.push({ id: data.card, amount: data.cardAmount || 1, rarity: data.cardRarity || 'common' })
	}

	let boosters = data.boosters || []
	if (data.booster) {
		boosters.push({ id: data.booster, amount: data.boosterAmount || 1 })
	}

	return new Code(document.id, data.name, data.description, data.end, data.amount, data.cash, collections, cards, boosters)
}

class Code {
	constructor(id, name, description, end, amount, cash, collections = [], cards = [], boosters = []) {
		this.id = id
		this.name = name
		this.description = description
		this.end = end
		this.amount = amount
		this.cash = cash
		this.collections = collections
		this.cards = cards
		this.boosters = boosters
	}

	static initOne(name = "") {
		let id = Code.createId(name)
		const newCode = new Code(id, name, "", 0, 1, 0, [], [], [])
		return newCode
	}

	static createId(name) {
		let id = name
			.replace(/[^a-zA-Z0-9 ]/g, "")
			.replace(/ /g, "-")
			.toLowerCase()
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "")
		return id
	}

	static async getAll() {
		const documents = await getDocs(collection(db, collectionName))
		return documents.docs.map(docToInstance)
	}

	static async getById(id) {
		const document = await getDoc(doc(db, collectionName, id))
		return docToInstance(document)
	}

	static async getByName(name) {
		const q = query(collection(db, collectionName), where("name", "==", name))
		const documents = await getDocs(q)
		return documents.docs.map(docToInstance)
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

	static async listenByName(name, callback) {
		const q = query(collection(db, collectionName), where("name", "==", name))
		return onSnapshot(q, (snapshot) => {
			const list = []
			snapshot.forEach((doc) => {
				list.push(docToInstance(doc))
			})
			callback(list)
		})
	}

	async save() {
		const new_doc = {
			name: this.name,
			description: this.description,
			end: this.end,
			amount: this.amount,
			cash: this.cash,
			collections: this.collections,
			cards: this.cards,
			boosters: this.boosters
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			this.id = Code.createId(this.name)
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

export default Code
