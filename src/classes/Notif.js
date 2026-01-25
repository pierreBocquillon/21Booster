import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "notifs"

function docToInstance(document) {
	let data = document.data()
	return data ? new Notif(document.id, data.user, data.date, data.type, data.data) : null
}

class Notif {
	constructor(id, user, date, type, data) {
		this.id = id
		this.user = user
		this.date = date
		this.type = type
		this.data = data
	}

	static initOne(user = "") {
		const newNotif = new Notif(null, user, new Date().getTime(), "", {})
		return newNotif
	}

	static async getAll() {
		const documents = await getDocs(collection(db, collectionName))
		return documents.docs.map(docToInstance)
	}

	static async getById(id) {
		const document = await getDoc(doc(db, collectionName, id))
		return docToInstance(document)
	}

  static async getByUser(userId) {
    const q = query(collection(db, collectionName), where("user", "==", userId))
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

  static async listenByUser(userId, callback) {
    const q = query(collection(db, collectionName), where("user", "==", userId))
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
			user: this.user,
			date: this.date,
			type: this.type,
			data: this.data,
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

export default Notif
