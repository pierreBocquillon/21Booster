import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId, deleteField } from "firebase/firestore"
let db = getFirestore()

let collectionName = "cards"

function docToInstance(document) {
	let data = document.data()
	if (!data) return null

	let type = data.type
	if (!type) {
		if (data.dropRate === 4) type = 'common'
		else if (data.dropRate === 3) type = 'uncommon'
		else if (data.dropRate === 2) type = 'rare'
		else if (data.dropRate === 1) type = 'mythic'
		else type = 'common'
	}

	return new Card(document.id, data.number, data.name, data.image, data.collection, type)
}

class Card {
	constructor(id, number, name, image, collection, type) {
		this.id = id
		this.number = number
		this.name = name
		this.image = image
		this.collection = collection
		this.type = type
	}

	static initOne(name = "") {
		let id = Card.createId(name)
		const newCard = new Card(id, "", name, "", "", "common")
		return newCard
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

	static buildImageUrl(imageName) {
		if (!imageName) return '';
		return `https://firebasestorage.googleapis.com/v0/b/tcg-21.firebasestorage.app/o/compressedCard%2F${encodeURIComponent(imageName)}?alt=media`;
	}

	async save() {
		const new_doc = {
			number: this.number,
			name: this.name,
			image: this.image,
			collection: this.collection,
			type: this.type,
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			this.id = Card.createId(this.name)
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
				if (profileData.cards && profileData.cards[this.id]) {
					const updateData = {}
					updateData[`cards.${this.id}`] = deleteField()
					updatePromises.push(updateDoc(profileDoc.ref, updateData))
				}
			})

			await Promise.all(updatePromises)
			await deleteDoc(doc(db, collectionName, this.id))
		}
		return true
	}
}

export default Card
