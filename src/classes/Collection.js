import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId, deleteField } from "firebase/firestore"
let db = getFirestore()

let collectionName = "collections"

function docToInstance(document) {
	let data = document.data()
	return data ? new Collection(document.id, data.name, data.coverImage, data.pageImage, data.cardImage, data.isPublic, data.number) : null
}

class Collection {
	constructor(id, name, coverImage, pageImage, cardImage, isPublic, number) {
		this.id = id
		this.name = name
		this.coverImage = coverImage
		this.pageImage = pageImage
		this.cardImage = cardImage
		this.isPublic = isPublic
		this.number = number || 0
	}

	static initOne(name = "") {
		let id = Collection.createId(name)
		const newCollection = new Collection(id, name, "", "", "", false, 0)
		return newCollection
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
			coverImage: this.coverImage,
			pageImage: this.pageImage,
			cardImage: this.cardImage,
			isPublic: this.isPublic,
			number: this.number,
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			this.id = Collection.createId(this.name)
			await setDoc(doc(db, collectionName, this.id), new_doc)
		}
		return true
	}

	async delete() {
		if (this.id) {
			// 1. Get all associated cards and boosters
			const cardsQuery = query(collection(db, "cards"), where("collection", "==", this.id))
			const boostersQuery = query(collection(db, "boosters"), where("collection", "==", this.id))

			const [cardsSnapshot, boostersSnapshot, profilesSnapshot] = await Promise.all([
				getDocs(cardsQuery),
				getDocs(boostersQuery),
				getDocs(collection(db, "profiles")),
			])

			const cardIds = cardsSnapshot.docs.map((d) => d.id)
			const boosterIds = boostersSnapshot.docs.map((d) => d.id)

			// 2. Cleanup all user profiles
			const updatePromises = []
			profilesSnapshot.forEach((profileDoc) => {
				const profileData = profileDoc.data()
				const updateData = {}
				let hasChanges = false

				// Remove the collection itself from profile
				if (profileData.collections && profileData.collections[this.id]) {
					updateData[`collections.${this.id}`] = deleteField()
					hasChanges = true
				}

				// Remove all cards of this collection from profile
				cardIds.forEach((cardId) => {
					if (profileData.cards && profileData.cards[cardId]) {
						updateData[`cards.${cardId}`] = deleteField()
						hasChanges = true
					}
				})

				// Remove all boosters of this collection from profile
				boosterIds.forEach((boosterId) => {
					if (profileData.boosters && profileData.boosters[boosterId]) {
						updateData[`boosters.${boosterId}`] = deleteField()
						hasChanges = true
					}
				})

				if (hasChanges) {
					updatePromises.push(updateDoc(profileDoc.ref, updateData))
				}
			})

			await Promise.all(updatePromises)

			// 3. Delete card and booster documents
			const deleteSubItemsPromises = []
			cardIds.forEach((id) => deleteSubItemsPromises.push(deleteDoc(doc(db, "cards", id))))
			boosterIds.forEach((id) => deleteSubItemsPromises.push(deleteDoc(doc(db, "boosters", id))))
			await Promise.all(deleteSubItemsPromises)

			// 4. Finally delete the collection itself
			await deleteDoc(doc(db, collectionName, this.id))
		}
		return true
	}
}

export default Collection
