import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId, deleteField } from "firebase/firestore"
let db = getFirestore()

let collectionName = "boosters"

function docToInstance(document) {
	let data = document.data()
	return data ? new Booster(document.id, data.name, data.image, data.size, data.collection, data.price, data.canBuy) : null
}

class Booster {
	constructor(id, name, image, size, collection, price, canBuy) {
		this.id = id
		this.name = name
		this.image = image
		this.size = size
		this.collection = collection
		this.price = price
		this.canBuy = canBuy
	}

	static initOne(name = "") {
		let id = Booster.createId(name)
		const newBooster = new Booster(id, name, "", 5, "", 100, false)
		return newBooster
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
			image: this.image,
			size: this.size,
			collection: this.collection,
			price: this.price,
			canBuy: this.canBuy,
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			this.id = Booster.createId(this.name)
			await setDoc(doc(db, collectionName, this.id), new_doc)
		}
		return true
	}

	async delete() {
		if (this.id) {
			const profilesSnapshot = await getDocs(collection(db, "profiles"))
			const updatePromises = []

			profilesSnapshot.forEach((profileDoc) => {
				const profileData = profileDoc.data()
				if (profileData.boosters && profileData.boosters[this.id]) {
					const updateData = {}
					updateData[`boosters.${this.id}`] = deleteField()
					updatePromises.push(updateDoc(profileDoc.ref, updateData))
				}
			})

			await Promise.all(updatePromises)
			await deleteDoc(doc(db, collectionName, this.id))
		}
		return true
	}
}

export default Booster
