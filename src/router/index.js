import { createRouter, createWebHistory } from "vue-router"
import { nextTick } from "vue"
import Boosters from "../views/Boosters.vue"

const routes = [
	{
		name: "Accueil",
		path: "/",
		component: () => import("@/views/Home.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Mes Boosters",
		path: "/boosters",
		component: () => import("@/views/Boosters.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Mes Collections",
		path: "/collections",
		component: () => import("@/views/Collections.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Mes Statistiques",
		path: "/statistics",
		component: () => import("@/views/Statistics.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Statistiques du joueur",
		path: "/statistics/:id",
		component: () => import("@/views/Statistics.vue"),
		meta: {
			needAccount: false,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Mes Succès",
		path: "/achievements",
		component: () => import("@/views/Achievements.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Succès du joueur",
		path: "/achievements/:id",
		component: () => import("@/views/Achievements.vue"),
		meta: {
			needAccount: false,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Boutique",
		path: "/shop",
		component: () => import("@/views/Shop.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Codes",
		path: "/codes",
		component: () => import("@/views/Codes.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Classement",
		path: "/leaderboard",
		component: () => import("@/views/Leaderboard.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
	{
		name: "Config",
		path: "/config",
		component: () => import("@/views/Config.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: ["creator"],
		},
	},
	{
		name: "Logs",
		path: "/logs",
		component: () => import("@/views/Logs.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: ["seller", "moderator"],
		},
	},
	{
		name: "Utilisateurs",
		path: "/users",
		component: () => import("@/views/Users.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: ["seller", "moderator"],
		},
	},
	{
		name: "Connexion",
		path: "/login",
		component: () => import("@/views/Login.vue"),
		meta: {
			needAccount: false,
			showNav: false,
			permissions: [],
		},
	},
	{
		name: "Demande d'accès",
		path: "/askAccess",
		component: () => import("@/views/AskAccess.vue"),
		meta: {
			needAccount: false,
			showNav: false,
			permissions: [],
		},
	},
	{
		name: "Casino",
		path: "/casino",
		component: () => import("@/views/Casino.vue"),
		meta: {
			needAccount: true,
			showNav: true,
			permissions: [],
		},
	},
]

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes,
})

router.afterEach((to, from) => {
	nextTick(() => {
		document.title = "21 Booster - " + to.name
	})
})

export default router
