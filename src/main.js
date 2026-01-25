import {firebaseApp} from '@/plugins/firebase.js'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'
import { createPinia } from 'pinia'

import "@/styles/styles.scss"
import "@/styles/swal.scss"
import "@/styles/booster.scss"

loadFonts()
const pinia = createPinia()

createApp(App)
	.use(pinia)
  .use(router)
  .use(vuetify)
  .mount('#app')
