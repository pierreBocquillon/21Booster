<template>
  <div class="d-flex flex-column align-center justify-center" style="height: 100vh;">
    <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%;">
      <v-card-title class="text-center">
        <img src="/logo-rect.png" width="420" class="mb-5" />
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="firstname" label="Prénom" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="lastname" label="Nom" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="password" label="Mot de passe" type="password" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <div class="d-flex flex-column justify-center align-center">
          <v-btn @click="login" color="primary" class="mt-3">Se connecter</v-btn>
          <span class="text-secondary mt-3">ou</span>
          <v-btn @click="askAccess" color="secondary" variant="text">Créer un compte</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import { getFunctions, httpsCallable } from 'firebase/functions'

import Profile from "@/classes/Profile.js"
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth"

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      firstname: '',
      lastname: '',
      password: '',
      profileList: [],
      nameList: [],
    }
  },
  async mounted() {
    signOut(getAuth()).then(() => {
      this.userStore.isLoggedIn = false
      this.userStore.profile = null
      this.userStore.uid = null
    })

    // Listen to ALL profiles to be able to detect banned/rejected ones for the login check
    // Previously it was only listening to activated profiles which hid suspended users
    this.unsub.push(Profile.listenAll(async profiles => {
      this.profileList = profiles
      this.nameList = profiles.map(profile => profile.name)
    }))
  },
  methods: {
    debugReset() {
      httpsCallable(getFunctions(), 'changePassword')({
        "userId": "FjLs9fn1ltWBbzgxCAv402svYz22",
        "hash": "MTIzNDU2",
      })
    },
    askAccess() {
      this.$router.push('/askAccess')
    },
    login() {
      if (!this.firstname || this.firstname.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le prénom est requis.',
          timer: 3000,
        })
        return
      }

      if (!this.lastname || this.lastname.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le nom est requis.',
          timer: 3000,
        })
        return
      }

      // Construct name for search (Case insensitive search against loaded profiles)
      // Assuming standard "Firstname Lastname" format
      let searchName = `${this.firstname.trim()} ${this.lastname.trim()}`.toLowerCase()

      let selectedProfile = this.profileList.find(profile => profile.name.toLowerCase() === searchName)

      if (!selectedProfile) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le profil sélectionné n\'existe pas.',
          timer: 3000,
        })
        return
      }

      // Check if profile is suspended
      if (!selectedProfile.activated) {
        Swal.fire({
          icon: 'error',
          title: 'Compte suspendu',
          text: 'Ce compte a été suspendu. Veuillez contacter un administrateur.',
          timer: 5000,
        })
        return
      }

      if (!this.password || this.password.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le mot de passe est requis.',
          timer: 3000,
        })
        return
      }

      // Use the actual profile name from DB for email generation to ensure match
      let email = `${selectedProfile.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@21tcg.ls`

      signInWithEmailAndPassword(getAuth(), email, this.password)
        .then(() => {
          this.userStore.profile = selectedProfile
          this.userStore.uid = getAuth().currentUser.uid
          this.userStore.isLoggedIn = true
          this.$router.push('/')
        })
        .catch((error) => {
          Swal.fire({
            icon: 'error',
            title: 'Echec',
            text: 'Echec de la connexion. Vérifiez votre mot de passe.',
            timer: 3000,
          })
        })
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>