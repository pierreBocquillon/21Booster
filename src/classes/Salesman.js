import { getFirestore, doc, collection, query, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc } from "firebase/firestore"
let db = getFirestore()

let collectionName = "salesmen"

function docToInstance(document) {
	let data = document.data()
	return data ? new Salesman(document.id, data.firstname, data.lastname, data.phone) : null
}

class Salesman {
	constructor(id, firstname, lastname, phone) {
		this.id = id
		this.firstname = firstname
		this.lastname = lastname
		this.phone = phone
	}

	static initOne() {
		return new Salesman(null, "", "", "")
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

	async save() {
		const data = {
			firstname: this.firstname,
			lastname: this.lastname,
			phone: this.phone,
		}

		if (this.id) {
			await setDoc(doc(db, collectionName, this.id), data)
		} else {
			const docRef = await addDoc(collection(db, collectionName), data)
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

export default Salesman
