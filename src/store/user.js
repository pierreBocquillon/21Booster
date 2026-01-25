import { defineStore } from "pinia"

export const useUserStore = defineStore("user", {
	state: () => ({
		uid: null,
		ip: null,
		profile: null,
		isLoggedIn: false,
	}),
})
