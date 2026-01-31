<template>
  <v-app-bar app dark class="header">
    <h1 class="d-flex align-center pointer" @click="userStore.isLoggedIn ? $router.push('/') : $router.push('/login')">
      <!-- <span class="ml-2 text-h4 font-weight-bold text-primary">21 Booster</span> -->
      <img class="ml-1" src="/logo-rect.png" height="52" />
    </h1>
    <v-spacer></v-spacer>
    <div class="d-flex flex-row align-center justify-center" v-if="userStore.isLoggedIn">
      <div class="mr-5 d-flex flex-row align-center justify-center cursor-pointer" @click="handleCashClick">
        <v-img src="/card-coin.png" height="30" width="30"></v-img>
        <h3>&nbsp;x&nbsp;</h3>
        <h2>{{ formatMoney(userStore.profile?.cash) }}</h2>
      </div>
      <v-btn icon variant="text" color="primary" class="mr-2" @click="showHelpDialog = true">
        <v-icon size="28">mdi-help-circle-outline</v-icon>
      </v-btn>
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon variant="plain" v-bind="props" @click="handleMenuClick">
            <v-icon size="32">mdi-menu</v-icon>
          </v-btn>
        </template>
        <v-list style="min-width:250px">
          <template v-for="group in filteredNavItems">
            <template v-for="item in group">
              <v-list-item @click="$router.push(item.link)">
                <div class="d-flex align-center" :class="{ 'text-primary': $route.path === item.link }">
                  <v-img height="42" width="42" :src="`/nav/${item.icon}`"></v-img>
                  <h3 class="w-100 font-weight-regular pl-3">{{ item.title }}</h3>
                </div>
              </v-list-item>
            </template>
            <v-divider color="white" class="my-2 border-opacity-75" thickness="1"></v-divider>
          </template>

          <v-list-item @click="reset">
            <div class="d-flex align-center">
                  <v-img height="42" width="42" src="/nav/reset.png"></v-img>
              <h3 class="w-100 font-weight-regular">Réinitialiser mon profil</h3>
            </div>
          </v-list-item>

          <v-list-item @click="openResetPasswordDialog">
            <div class="d-flex align-center">
                  <v-img height="42" width="42" src="/nav/changePassword.png"></v-img>
              <h3 class="w-100 font-weight-regular">Changer mon mot de passe</h3>
            </div>
          </v-list-item>

          <v-list-item @click="logout">
            <div class="d-flex align-center">
                  <v-img height="42" width="42" src="/nav/quit.png"></v-img>
              <h3 class="w-100 font-weight-regular">Se déconnecter</h3>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <v-dialog v-model="resetPasswordDialog" max-width="500">
      <v-card>
        <v-card-text>
          <h1 class="text-primary text-center">Changer de mot de passe</h1>
          <v-text-field label="Ancien mot de passe" type="password" v-model="oldPassword"></v-text-field>
          <v-text-field label="Nouveau mot de passe" type="password" v-model="newPasswordA"></v-text-field>
          <v-text-field label="Confirmer le nouveau mot de passe" type="password" v-model="newPasswordB"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="resetPassword">Changer</v-btn>
          <v-btn text @click="closeResetPasswordDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSellersDialog" max-width="500">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 text-primary text-center">
          Besoin de plus de card coins ?
        </v-card-title>
        <v-card-text>
          <p class="text-center mb-4 subtitle-1">Contacter un de nos vendeurs :</p>
          <v-list lines="one" class="bg-transparent">
            <v-list-item v-for="(seller, index) in sellers" :key="index" :title="seller.firstname + ' ' + seller.lastname" :subtitle="'(' + seller.phone + ')'" class="mb-2 py-3 rounded bg-background">
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon>mdi-account-cash</v-icon>
                </v-avatar>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="text" @click="showSellersDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="showHelpDialog" max-width="800">
      <HeaderHelpCard :settings="settings" @close="showHelpDialog = false" />
    </v-dialog>

    <v-dialog v-model="showEasterEggDialog" max-width="800" persistent>
      <v-card class="pa-4 text-center rounded-xl position-relative">
        <v-sheet class="pa-2 pl-5 mb-5 bg-accent rounded-xl d-flex flex-row align-center justify-space-between" style="z-index: 2; position: relative;">
          <h4 class="text-wrap text-left" v-if="textSeq == 0">Arrêtez donc de frapper ce bouton comme un abruti !</h4>
          <h4 class="text-wrap text-left" v-if="textSeq == 1">Tiens ! Choisis-en un et laisse-moi tranquille !</h4>
          <h4 class="text-wrap text-left" v-if="textSeq == 2">Parfait, maintenant fiche le camp et laisse-moi dormir !</h4>
          <v-btn icon variant="tonal" @click="nextText" v-if="textSeq != 1"><v-icon>mdi-arrow-right</v-icon></v-btn>
        </v-sheet>
        <v-img src="/demon_full.png" height="400" contain style="opacity: 1; transition: opacity 0.3s;" :style="{ opacity: textSeq == 1 ? '0.3' : '1' }"></v-img>
        
        <div v-if="textSeq == 1" class="d-flex flex-wrap justify-center align-center position-absolute w-100 h-100" style="top:0; left:0; padding-top: 80px; overflow-y: auto;">
            <v-card v-for="booster in publicBoosters" :key="booster.id" class="ma-2 cursor-pointer elevation-4" @click="pickBooster(booster)" width="120" color="surface">
                <v-img :src="'/boosters/' + booster.image" height="200" cover class="align-end"></v-img>
            </v-card>
        </div>
      </v-card>
    </v-dialog>

  </v-app-bar>
</template>
<script>
import { getAuth, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential} from "firebase/auth"

import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'

import logsManager from '@/assets/functions/logsManager.js'
import notifManager from '@/assets/functions/notifManager.js'

import Salesman from '@/classes/Salesman.js'
import Settings from '@/classes/Settings.js'
import Booster from '@/classes/Booster.js'

import navItems from '@/config/navItems.js'
import HeaderHelpCard from './HeaderHelpCard.vue'

export default {
  components: {
    HeaderHelpCard
  },
  data() {
    return {
      auth: getAuth(),
      userStore: useUserStore(),
      navItems,
      unsub: [],
      showSellersDialog: false,
      showHelpDialog: false,
      sellers: [],
      boosters: [],
      settings: new Settings(),
      unsubSellers: null,
      resetPasswordDialog: false,
      oldPassword: '',
      newPasswordA: '',
      newPasswordB: '',
      menuClickCount: 0,
      menuClickTimer: null,
      showEasterEggDialog: false,
      textSeq: 0,
    }
  },
  created() {
    this.unsub.push(Settings.listenById("general", (s) => {
      this.settings = s || new Settings("general");
    }));
    this.unsub.push(Salesman.listenAll((list) => {
      this.sellers = list
    }).then(unsub => {
      this.unsubSellers = unsub
    this.unsub.push(Booster.listenAll((list) => {
      this.boosters = list
    }))
    }))
  },
  beforeUnmount() {
    if (this.unsubSellers) this.unsubSellers()
  },
  watch: {
    'userStore.profile': {
      handler(newProfile) {
        setTimeout(async () => {
          if (newProfile && !newProfile.helpSeen) {
            this.showHelpDialog = true
            newProfile.helpSeen = true
            await newProfile.save()
          }
        }, 1000);
      },
      immediate: true
    }
  },
  computed: {
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for (let group of this.navItems) {
        for (let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if (itemRoute && itemRoute.meta && itemRoute.meta.permissions) {
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if (tmp_item.permissions.length <= 0) hasAccess = true
          else if (userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if (userPerms && tmp_item.permissions.some(p => userPerms.includes(p))) hasAccess = true

          if (hasAccess) {
            currentGroup.push(tmp_item)
          }
        }
        if (currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems    
    },
    publicBoosters() {
      return this.boosters.filter(b => b.canBuy)
    },
  },
  methods: {
    async nextText() {
      this.textSeq++
      if (this.textSeq > 2){
        this.showEasterEggDialog = false

        if (this.userStore.profile) {
          if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};

          if (!this.userStore.profile.achievements['un_visiteur_demoniaque']) {
            this.userStore.profile.achievements['un_visiteur_demoniaque'] = true;
            
            notifManager.sendAchievementNotif(this.userStore.profile.id, 'un_visiteur_demoniaque', 'Vous avez obtenues le succès "Un visiteur demoniaque" !');
            await this.userStore.profile.save();
          }
        }

        setTimeout(() => {
          this.textSeq = 0
        }, 500)
      }
    },
    async pickBooster(booster) {
      if (!this.userStore.profile.boosters) this.userStore.profile.boosters = {}
      this.userStore.profile.boosters[booster.id] = (this.userStore.profile.boosters[booster.id] || 0) + 1
      await this.userStore.profile.save()
      
      logsManager.log(this.userStore.profile.name, 'EASTER_EGG', `A reçu le booster ${booster.name}`)
      
      this.textSeq++
    },
    handleMenuClick() {
      if (this.userStore.profile?.achievements?.['un_visiteur_demoniaque']) return

      this.menuClickCount++
      if (this.menuClickTimer) clearTimeout(this.menuClickTimer)
      
      if (this.menuClickCount >= 10) {
        this.showEasterEggDialog = true
        this.menuClickCount = 0
      } else {
        this.menuClickTimer = setTimeout(() => {
          this.menuClickCount = 0
        }, 500)
      }
    },
    formatMoney(value) {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '').replace(",00", "")
    },
    openResetPasswordDialog() {
      this.resetPasswordDialog = true;
      this.oldPassword = '';
      this.newPasswordA = '';
      this.newPasswordB = '';
    },
    closeResetPasswordDialog() {
      this.resetPasswordDialog = false;
    },
    async resetPassword() {
      const user = this.auth.currentUser

      if(this.newPasswordA !== this.newPasswordB) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Les nouveaux mots de passe ne correspondent pas.",
          timer: 2000,
        })
        return
      }

      try {
        const credential = EmailAuthProvider.credential(user.email, this.oldPassword)
        await reauthenticateWithCredential(user, credential)
      } catch (error) {
        if (error.code == 'auth/wrong-password' || error.code == 'auth/invalid-login-credentials') {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: "L'ancien mot de passe est incorrect.",
            timer: 2000,
          })
          return
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: error.code || "Une erreur est survenue. Merci de réessayer dans quelques minutes.",
            timer: 2000,
          })
          return
        }
      }

      try {
        logsManager.log(this.userStore.profile.name, 'PASSWORD', `Changement de mot de passe.`);
        await updatePassword(user, this.newPasswordA)

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: "Le mot de passe a été mis à jour avec succès.",
          timer: 2000,
        }).then(() => {
          this.closeResetPasswordDialog()
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || "Une erreur est survenue lors de la mise à jour du mot de passe.",
          timer: 2000,
        })
      }
    },

    reset() {
      Swal.fire({
        title: 'Êtes-vous sûr de vouloir réinitialiser votre profil ?',
        text: "Cette action est irréversible et supprimera toutes vos données de profil.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, réinitialiser mon profil',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          if (this.userStore.profile) {
            let settings = await Settings.getById("general");
            const welcomeBonus = settings ? settings.welcomeBonus : 500;

            this.userStore.profile.collections = {}
            this.userStore.profile.boosters = {}
            this.userStore.profile.cards = {}
            this.userStore.profile.codes = {}
            this.userStore.profile.achievements = {}
            this.userStore.profile.stats.open = 0
            this.userStore.profile.stats.destroy = 0
            this.userStore.profile.stats.upgrades = 0
            this.userStore.profile.stats.downgrades = 0
            this.userStore.profile.cash = welcomeBonus
            this.userStore.profile.oldCodeRefused = false
            this.userStore.profile.lastWheelSpin = 0
            this.userStore.profile.helpSeen = false
            this.userStore.profile.oldCodesVerified = null

            await this.userStore.profile.save();

            logsManager.log(this.userStore.profile.name, 'RESET', `Profil réinitialisé par l'utilisateur.`);

            //sessionStorage.removeItem('oldCodesVerified');
            //localStorage.removeItem('helpSeen');

            window.location.reload();
          }
        }
      });
    },
    logout() {
      signOut(getAuth()).then(() => {
        // sessionStorage.removeItem('oldCodesVerified');
        this.$router.push('/login');
      }).catch(error => {
        console.error("Error signing out: ", error);
      });
    },
    async handleCashClick() {
      // 1. Unlock Achievement 'ou_est_mon_dealer' if not yet unlocked
      if (this.userStore.profile) {
        if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};

        if (!this.userStore.profile.achievements['ou_est_mon_dealer']) {
          this.userStore.profile.achievements['ou_est_mon_dealer'] = true;
          
          notifManager.sendAchievementNotif(this.userStore.profile.id, 'ou_est_mon_dealer', 'Vous avez obtenues le succès "Où est mon dealer" !');
          await this.userStore.profile.save();
        }
      }

      // 2. Show the Sellers Dialog
      this.showSellersDialog = true;
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>