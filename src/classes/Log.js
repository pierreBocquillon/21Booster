import { getFirestore, doc, collection, query, where, orderBy, limit, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "logs"

function docToInstance(document) {
	let data = document.data()
	return data ? new Log(document.id, data.user, data.date, data.type, data.description) : null
}

class Log {
	constructor(id, user, date, type, description) {
		this.id = id
		this.user = user
		this.date = date
		this.type = type
		this.description = description
	}

	static initOne(user = "") {
		const newLog = new Log(null, user, "", "", "")
		return newLog
	}

	static async getAll() {
		const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
		const q = query(collection(db, collectionName), where("date", ">=", sevenDaysAgo))
		const documents = await getDocs(q)
		return documents.docs.map(docToInstance)
	}

	static async getById(id) {
		const document = await getDoc(doc(db, collectionName, id))
		return docToInstance(document)
	}

	static async listenAll(callback) {
		const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000)
		const q = query(collection(db, collectionName), where("date", ">=", sevenDaysAgo), limit(100))
		return onSnapshot(q, (snapshot) => {
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
			user: this.user,
			date: this.date,
			type: this.type,
			description: this.description,
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), new_doc)
		} else {
			const docRef = await addDoc(collection(db, collectionName), new_doc)
			this.id = docRef.id
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

export default Log
