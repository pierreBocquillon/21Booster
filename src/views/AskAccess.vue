<template>
  <div class="d-flex flex-column align-center justify-center" style="height: 100vh;">
    <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%; overflow: auto;">
      <v-card-title class="text-center">
        <img src="/logo-rect.png" width="420" class="mb-5" />
      </v-card-title>
      <v-card-text>
        <v-text-field v-model="firstname" label="Prenom [RP]" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="lastname" label="Nom [RP]" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="phone" label="Téléphone [RP]" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="passwordA" label="Mot de passe" type="password" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <v-text-field v-model="passwordB" label="Confirmer le mot de passe" type="password" variant="outlined" color="primary" base-color="primary" autocomplete="off"></v-text-field>
        <div class="d-flex flex-column justify-center align-center">
          <v-btn @click="askAccess" color="primary" class="mt-3">Créer un compte</v-btn>
          <span class="text-secondary mt-3">ou</span>
          <v-btn @click="goToLogin" color="secondary" variant="text">Se connecter</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"

import Profile from "@/classes/Profile.js"
import Settings from "@/classes/Settings.js"

import Swal from 'sweetalert2/dist/sweetalert2.js'

export default {
  props: [],
  data() {
    return {
      userStore: useUserStore(),
      firstname: '',
      lastname: '',
      phone: '',
      passwordA: '',
      passwordB: '',
      idList: ['Camille Honete', 'Monsieur X', 'Laurent Gina'],
    }
  },
  methods: {
    async askAccess() {
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

      let fullName = `${this.firstname.toUpperCase()[0]}${this.firstname.slice(1).toLowerCase()} ${this.lastname.toUpperCase()[0]}${this.lastname.slice(1).toLowerCase()}`
      let email = `${fullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@21tcg.ls`
      let phone = this.phone ? this.phone.trim() : ''
      if(phone.startsWith('555')) {
        phone = phone.slice(3)
      }
      phone = phone.replace(/\D/g, '')

      if(phone.length != 4) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le numéro de téléphone est incorrect.',
          timer: 3000,
        })
        return
      }

      let existingProfile = await Profile.getByName(fullName)
      if (existingProfile && existingProfile.length > 0) {
        if (existingProfile[0].activated || !existingProfile[0].rejected) {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Ce profil existe déjà.',
            timer: 3000,
          })
        } else if (existingProfile[0].rejected) {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Ce profil a été suspendu !',
            showCancelButton: true,
            confirmButtonText: 'Oui, réitérer',
          })
        }
        return
      }

      if (!this.passwordA || this.passwordA.trim() === '' || !this.passwordB || this.passwordB.trim() === '') {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le mot de passe est requis.',
          timer: 3000,
        })
        return
      }

      if (this.passwordA.length < 6) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Le mot de passe doit contenir au moins 6 caractères.',
          timer: 3000,
        })
        return
      }

      if (this.passwordA != this.passwordB) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Les mots de passe ne correspondent pas.',
          timer: 3000,
        })
        return
      }

      createUserWithEmailAndPassword(getAuth(), email, this.passwordA)
        .then(async (userCredential) => {
          const user = userCredential.user
          let settings = await Settings.getById("general")
          let newProfile = Profile.initOne(user.uid, fullName, email, phone)
          newProfile.activated = true
          newProfile.cash = settings ? settings.welcomeBonus : 100
          await newProfile.save()
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Votre compte a été créé. Vous pouvez dès à présent vous connecter pour accéder aux services.',
          }).then(() => {
            signOut(getAuth()).then(() => {
              this.goToLogin()
            }).catch((error) => {
              console.error('Error signing out:', error)
            })
          })
        })
    },
    goToLogin() {
      this.firstname = ''
      this.lastname = ''
      this.passwordA = ''
      this.passwordB = ''

      this.$router.push('/login')
    }
  },
}
</script>