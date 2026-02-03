import { defineStore } from "pinia"
import Card from "@/classes/Card.js"
import Collection from "@/classes/Collection.js"
import Booster from "@/classes/Booster.js"
import Settings from "@/classes/Settings.js"

export const useDataStore = defineStore("data", {
	state: () => ({
		cards: [],
		collections: [],
		boosters: [],
		settings: null,
		unsubscribers: {
			cards: null,
			collections: null,
			boosters: null,
			settings: null,
		},
		loading: {
			cards: false,
			collections: false,
			boosters: false,
			settings: false,
		}
	}),
	getters: {
		getCard: (state) => (id) => state.cards.find(c => c.id === id),
		getCollection: (state) => (id) => state.collections.find(c => c.id === id),
		getBooster: (state) => (id) => state.boosters.find(c => c.id === id),
	},
	actions: {
		async bindCards() {
			if (this.unsubscribers.cards) return // Already listening
			
			this.loading.cards = true
			this.unsubscribers.cards = await Card.listenAll((list) => {
				this.cards = list
				this.loading.cards = false
			})
		},
		async bindCollections() {
			if (this.unsubscribers.collections) return // Already listening

			this.loading.collections = true
			this.unsubscribers.collections = await Collection.listenAll((list) => {
				this.collections = list
				this.loading.collections = false
			})
		},
		async bindBoosters() {
			if (this.unsubscribers.boosters) return // Already listening

			this.loading.boosters = true
			this.unsubscribers.boosters = await Booster.listenAll((list) => {
				this.boosters = list
				this.loading.boosters = false
			})
		},
		async bindSettings() {
			if (this.unsubscribers.settings) return // Already listening

			this.loading.settings = true
			this.unsubscribers.settings = await Settings.listenById("general", (s) => {
				this.settings = s
				this.loading.settings = false
			})
		},
		unbindAll() {
			if (this.unsubscribers.cards) {
				this.unsubscribers.cards()
				this.unsubscribers.cards = null
			}
			if (this.unsubscribers.collections) {
				this.unsubscribers.collections()
				this.unsubscribers.collections = null
			}
			if (this.unsubscribers.boosters) {
				this.unsubscribers.boosters()
				this.unsubscribers.boosters = null
			}
			if (this.unsubscribers.settings) {
				this.unsubscribers.settings()
				this.unsubscribers.settings = null
			}
			this.cards = []
			this.collections = []
			this.boosters = []
			this.settings = null
		}
	}
})
