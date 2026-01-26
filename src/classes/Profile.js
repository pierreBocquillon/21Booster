import { getFirestore, doc, collection, query, where, addDoc, getDoc, getDocs, updateDoc, setDoc, onSnapshot, deleteDoc, documentId } from "firebase/firestore"
let db = getFirestore()

let collectionName = "profiles"

function docToInstance(document) {
	let data = document.data()
  
	return data ? new Profile(document.id, data.name, data.email, data.phone, data.role, data.permissions, data.activated, data.cash, data.collections, data.boosters, data.cards, data.codes, data.achievements, data.stats, data.lastLogin) : null
}

class Profile {
	constructor(id, name, email, phone, role, permissions, activated, cash, collections, boosters, cards, codes, achievements, stats, lastLogin) {
		this.id = id
		this.name = name
		this.email = email
		this.phone = phone
		this.role = role
		this.permissions = permissions
		this.activated = activated
		this.cash = cash
		this.collections = collections
		this.boosters = boosters
		this.cards = cards
		this.codes = codes
		this.achievements = achievements
		this.stats = stats
		this.lastLogin = lastLogin

  if (!this.stats) {
    this.stats = {
      public: true,
      open: 0,
      destroy: 0,
      upgrades: 0,
      downgrades: 0,
    }
  }else{
    if(this.stats.public === undefined){this.stats.public = true}
    if(this.stats.open === undefined){this.stats.open = 0}
    if(this.stats.destroy === undefined){this.stats.destroy = 0}
    if(this.stats.upgrades === undefined){this.stats.upgrades = 0}
    if(this.stats.downgrades === undefined){this.stats.downgrades = 0}
  } 
	}


	static initOne(uid, name, email, phone, cash = 0) {
		let stats = {
			public: true,
			open: 0,
			destroy: 0,
			upgrades: 0,
			downgrades: 0,
		}
		const newProfile = new Profile(uid, name, email, phone, "User", [], false, cash, {}, {}, {}, {}, {}, {}, stats, 0)
		return newProfile
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

	static async getByEmail(email) {
		const q = query(collection(db, collectionName), where("email", "==", email))
		const documents = await getDocs(q)
		return documents.docs.map(docToInstance)
	}

	static async getByActivated(activated) {
		const q = query(collection(db, collectionName), where("activated", "==", activated))
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

	static async listenByEmail(email, callback) {
		const q = query(collection(db, collectionName), where("email", "==", email))
		return onSnapshot(q, (snapshot) => {
			const list = []
			snapshot.forEach((doc) => {
				list.push(docToInstance(doc))
			})
			callback(list)
		})
	}

	static async listenByActivated(activated, callback) {
		const q = query(collection(db, collectionName), where("activated", "==", activated))
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
			email: this.email,
      phone: this.phone,
			role: this.role,
			permissions: this.permissions,
			activated: this.activated,
			cash: this.cash,
			collections: this.collections,
			boosters: this.boosters,
			cards: this.cards,
			codes: this.codes,
			achievements: this.achievements,
			stats: this.stats,
			lastLogin: this.lastLogin,
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

export default Profile
