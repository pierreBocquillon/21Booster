<template>
  <v-app  style="background: url('/bg.png'); background-position: center center; background-size: cover; background-attachment: fixed;">
    <v-dialog v-model="showLoader" persistent max-width="500px">
      <v-card class="pa-10 d-flex flex-column align-center justify-center" style="border-radius: 20px; opacity: .9; overflow: hidden;">
        <h1 class="text-primary mb-3">Chargement ...</h1>
        <v-progress-circular color="primary" indeterminate :size="200" :width="10">
          <v-img class="mx-2" height="125" width="100" src="/logo-carre.png"></v-img>
        </v-progress-circular>
      </v-card>
    </v-dialog>

    <Header v-if="ready && $route.meta.showNav && canAccess && hasGoodPermissions"></Header>
    <v-main v-if="ready && canAccess && hasGoodPermissions">
      <router-view class="w-100" />
    </v-main>

    <v-main v-else-if="ready && !canAccess">
      <div class="d-flex flex-column justify-center align-center" style="height: 100vh;">
        <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%; overflow: auto;">
          <v-card-title class="text-center">
            <img src="/logo-carre.png" height="150" />
            <h1 class="text-h4 mb-3 text-primary">Accès refusé</h1>
          </v-card-title>
          <v-card-text>
            <p class="text-center mb-3">Vous devez être connecté pour accéder à cette page.</p>
            <div class="d-flex flex-column justify-center align-center">
              <v-btn @click="$router.push('/login')" color="primary" class="mt-3">Aller à la page de connexion</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-main>

    <v-main v-else-if="ready && !hasGoodPermissions">
      <div class="d-flex flex-column justify-center align-center" style="height: 100vh;">
        <v-card class="pa-4 rounded-xl" style="max-width: 600px; width: 100%; overflow: auto;">
          <v-card-title class="text-center">
            <img src="/logo-carre.png" height="150" />
            <h1 class="text-h4 mb-3 text-primary">Accès refusé</h1>
          </v-card-title>
          <v-card-text>
            <p class="text-center mb-3">Vous n'avez pas les autorisations nécessaires pour accéder à cette page.</p>
            <div class="d-flex flex-column justify-center align-center">
              <v-btn @click="$router.push('/')" color="primary" class="mt-3">Aller à la page d'accueil</v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-main>


    <footer class="pa-3 text-center header" v-if="ready && $route.meta.showNav">
      COPYRIGHT &copy; {{ new Date().getFullYear() }} T&T, All rights Reserved
    </footer>

    <div v-if="ready && $route.meta.showNav && $route.meta.needAccount" class="notif-container" style="position: fixed; top: 10px; right: 10px; z-index: 100000; max-height: calc(100% - 20px); overflow-y: hidden;">
      <v-card v-for="notif in notifs" :key="notif.id" class="elevation-10 rounded-lg mb-2 pa-3 " border="opacity-100 md primary" style="max-width: 600px;" @click="openNotif(notif)">
        <div class="d-flex flex-row align-center justify-space-between">
          <h5 class="mx-3 mb-2">Le {{ new Date(notif.date).toLocaleString().slice(0, 10) }} à {{ new Date(notif.date).toLocaleString().slice(11, 16) }} :</h5>
          <v-btn icon size="x-small" variant="plain" @click="closeNotif(notif)"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="mx-3 d-flex flex-row align-center justify-start" style="width: 100%;" v-if="notif.type == 'CASH'">
          <img src="/card-coin.png" style="height: 50px; width: 50px; object-fit: contain;">
          <div class="ml-5">
            <h3>Vous avez recu {{ notif.data.amount }} card coins !</h3>
            <h5>( {{ notif.data.reason }} )</h5>
          </div>
        </div>
        <div class="mx-3 d-flex flex-row align-center justify-start" style="width: 100%;" v-if="notif.type == 'CARD'">
          <img src="/logo-carre.png" style="height: 50px; width: 50px; object-fit: contain;">
          <div class="ml-5">
            <h3>Vous avez recu {{Object.values(notif.data.cards).reduce((acc, val) => acc + val.amount, 0)}} carte(s) !</h3>
            <h5>{{ notif.data.reason }}</h5>
          </div>
        </div>
        <div class="mx-3 d-flex flex-row align-center justify-start" style="width: 100%;" v-if="notif.type == 'BOOSTER'">
          <img src="/logo-carre.png" style="height: 50px; width: 50px; object-fit: contain;">
          <div class="ml-5">
            <h3>Vous avez recu {{Object.values(notif.data.boosters).reduce((acc, val) => acc + val, 0)}} booster(s) !</h3>
            <h5>{{ notif.data.reason }}</h5>
          </div>
        </div>
        <div class="mx-3 d-flex flex-row align-center justify-start" style="width: 100%;" v-if="notif.type == 'ACHIEVEMENT'">
          <img v-if="achievementsData.find(a => a.id == notif.data.achievement).image" :src="`/achievements/${achievementsData.find(a => a.id == notif.data.achievement).image}`" style="height: 50px; width: 50px; object-fit: contain;">
          <img v-else src="/logo-carre.png" style="height: 50px; width: 50px; object-fit: contain;">
          <div class="ml-5">
            <h3>Succés débloqué !</h3>
            <h5>{{ notif.data.reason }}</h5>
          </div>
        </div>
      </v-card>
    </div>

    <v-dialog v-if="ready && $route.meta.showNav && $route.meta.needAccount" v-model="boosterDialog" max-width="800px" persistent style="z-index: 10000000000;">
      <v-card class="pa-3">
        <div class="d-flex flex-row align-center justify-space-between mb-5">
          <div>&nbsp;</div>
          <h3 class="text-center">{{currentNotif.data.reason}}</h3>
          <v-btn icon variant="text" @click="closeNotif(currentNotif)"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="d-flex flex-row my-5 mx-3 justify-center" :style="{ paddingRight: Math.min(299,300-(500 / currentBoosters.length)) + 'px' }">
          <v-img v-for="(booster, i) in currentBoosters" :key="i" class="notif-booster reveal-item" :src="`/boosters/${booster.image}`" :style="`--overlap: -${Math.min(299,300-(500 / currentBoosters.length))}px; animation-delay: ${getAnimationDelay(i, currentBoosters.length)}ms;`"></v-img>
        </div>
        <div class="d-flex flex-row align-center justify-center mt-5">
          <v-btn color="primary" variant="tonal" @click="goToBooster(currentNotif)">Aller voir mes boosters</v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-if="ready && $route.meta.showNav && $route.meta.needAccount" v-model="cardDialog" max-width="800px" persistent style="z-index: 10000000000;">
      <v-card class="pa-3">
        <div class="d-flex flex-row align-center justify-space-between mb-5">
          <div>&nbsp;</div>
          <h3 class="text-center">{{currentNotif.data.reason}}</h3>
          <v-btn icon variant="text" @click="closeNotif(currentNotif)"><v-icon>mdi-close</v-icon></v-btn>
        </div>
        <div class="d-flex flex-row my-5 mx-3 justify-center" :style="{ paddingRight: Math.min(299,300-(500 / currentCards.length)) + 'px' }">
          <v-img v-for="(card, i) in currentCards" :key="i" class="notif-card reveal-item" :src="`/cards/${card.image}`" :class="card.rarity" :style="`--booster-mask: url('/cards/${card.image}'); --mask-size: contain; --mask-position: center; --mask-repeat: no-repeat; --overlap: -${Math.min(299,300-(500 / currentCards.length))}px; animation-delay: ${getAnimationDelay(i, currentCards.length)}ms;`"></v-img>
        </div>
        <div class="d-flex flex-row align-center justify-center mt-5">
          <v-btn color="primary" variant="tonal" @click="goToCollection(currentNotif)">Aller voir mes collections</v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-app>
</template>


<script>
import { useDisplay } from 'vuetify'
import { useTheme } from 'vuetify'

import { getAuth, signOut, deleteUser } from '@firebase/auth'

import { useUserStore } from '@/store/user.js'

import Profile from "@/classes/Profile.js"
import Notif from "@/classes/Notif.js"
import Card from "@/classes/Card.js"
import Booster from "@/classes/Booster.js"
import Code from "@/classes/Code.js"
import Settings from "@/classes/Settings.js"

import achievementsData from "@/data/achievements.json"

import achievementsManager from '@/assets/functions/achievementsManager.js'
import notifManager from '@/assets/functions/notifManager.js'
import logsManager from '@/assets/functions/logsManager.js'

import Swal from 'sweetalert2/dist/sweetalert2.js'

import oldCards from '@/data/oldCards.json'

import Header from "@/components/common/Header.vue"

export default {
  components: {
    Header
  },
  setup() {
    const { mdAndUp } = useDisplay()
    const theme = useTheme()

    return { mdAndUp, theme }
  },
  data() {
    return {
      unsub: [],
      nestedUnsub: [],
      userStore: useUserStore(),
      achievementsData: achievementsData,
      loginModalIsOpen: false,
      ready: false,
      settings: new Settings(),
      cards: [],
      boosters: [],
      notifs: [],
      boosterDialog: false,
      cardDialog: false,
      currentNotif: null,
    }
  },
  watch: {
    $route() {
      this.checkOldCodes()
      this.checkDailyBonus()
    }
  },
  async mounted() {
    this.unsub.push(Settings.listenById("general", (s) => {
      this.settings = s || new Settings("general");
      this.checkDailyBonus(); // Check on settings load too
    }))

    this.unsub.push(Card.listenAll(cards => {
      this.cards = cards
    }))

    this.unsub.push(Booster.listenAll(boosters => {
      this.boosters = boosters
    }))

    setTimeout(() => {
      this.ready = true
    }, 3000)

    getAuth().onAuthStateChanged(async (user) => {
      if (user) {
        this.unsub.push(await Profile.listenById(user.uid, async profile => {
          if (profile) {
            this.userStore.profile = profile
            this.userStore.uid = user.uid
            this.userStore.isLoggedIn = true

            this.nestedUnsub.forEach(unsub => {
              if (typeof unsub === 'function') unsub()
            })

            this.nestedUnsub.push(Notif.listenByUser(profile.id, notifDoc => {
              if (notifDoc && notifDoc.length > 0) {
                this.notifs = notifDoc.sort((a, b) => b.date - a.date)
              } else {
                this.notifs = []
              }
            }))

            this.ready = true

            this.checkOldCodes()

          } else {
            deleteUser(user).then(() => {
              this.userStore.isLoggedIn = false
              this.userStore.profile = null
              this.userStore.uid = null
            }).catch((error) => {
              console.log(error)
            })
          }
        }))
      } else {
        this.userStore.profile = null
        this.userStore.uid = null
        // sessionStorage.removeItem('oldCodesVerified')
      }
    })
  },
  computed: {
    currentCards() {
      let currentCards = []
      for(let cardId in this.currentNotif.data.cards){
        if(this.cards.find(c => c.id === cardId)){
          for(let i = 0; i < this.currentNotif.data.cards[cardId].amount; i++){
            let tmp_card = JSON.parse(JSON.stringify(this.cards.find(c => c.id === cardId)))
            tmp_card.rarity = this.currentNotif.data.cards[cardId].rarity
            currentCards.push(tmp_card)
          }
        }
      }
      return currentCards
    },
    currentBoosters() {
      let currentBoosters = []
      for(let boosterId in this.currentNotif.data.boosters){
        if(this.boosters.find(b => b.id === boosterId)){
          for(let i = 0; i < this.currentNotif.data.boosters[boosterId]; i++){
            let tmp_booster = JSON.parse(JSON.stringify(this.boosters.find(b => b.id === boosterId)))
            currentBoosters.push(tmp_booster)
          }
        }
      }
      return currentBoosters
    },
    showLoader() {
      return !this.ready
    },
    hasGoodPermissions() {
      const requiredPerms = this.$route.meta.permissions
      if (!requiredPerms?.length) return true

      const userPerms = this.userStore.profile?.permissions
      if (!userPerms) return false

      if (userPerms.some(p => ['dev', 'admin'].includes(p))) return true

      return requiredPerms.some(p => userPerms.includes(p))
    },
    canAccess() {
      if (!this.$route.meta.needAccount) {
        return true
      } else {
        if (this.userStore.isLoggedIn && this.userStore.profile && this.userStore.profile.activated) {
          return true
        } else {
          return false
        }
      }
    }
  },
  methods: {
    getAnimationDelay(index, totalCount) {
      let groupSize = 1;
      if (totalCount > 50) {
        groupSize = 5;
      } else if (totalCount > 10) {
        groupSize = 2;
      }
      return Math.floor(index / groupSize) * 100;
    },
    async openNotif(notif) {
      this.currentNotif = notif
      if (notif.type === 'CASH' || notif.type === 'ACHIEVEMENT') {
        await notif.delete()
      } else if (notif.type === 'CARD') {
        this.cardDialog = true
      } else if (notif.type === 'BOOSTER') {
        this.boosterDialog = true
      }
    },
    async closeNotif(notif) {
      this.boosterDialog = false
      this.cardDialog = false
      await notif.delete()
    },
    async goToCollection(notif) {
      await this.closeNotif(notif)
      this.$router.push('/collections')
    },
    async goToBooster(notif) {
      await this.closeNotif(notif)
      this.$router.push('/boosters')
    },
    checkDailyBonus() {
      if (!this.userStore.isLoggedIn || !this.userStore.profile) return;
      if (!this.settings.dailyBonus || this.settings.dailyBonus <= 0) return;

      const today = new Date().toISOString().split('T')[0];
      let lastLoginDate = '';

      if (this.userStore.profile.lastLogin) {
        if (typeof this.userStore.profile.lastLogin === 'number') {
          lastLoginDate = new Date(this.userStore.profile.lastLogin).toISOString().split('T')[0];
        } else {
          lastLoginDate = this.userStore.profile.lastLogin;
        }
      } else {
        this.userStore.profile.lastLogin = new Date().getTime();
        this.userStore.profile.save();
        return;
      }

      if (lastLoginDate != today) {
        this.giveDailyBonus();
      }
    },
    async giveDailyBonus() {
      if (!this.userStore.profile) return;
      const bonus = this.settings.dailyBonus;

      try {
        // Prevent double execution locally
        this.userStore.profile.lastLogin = new Date().getTime();
        this.userStore.profile.cash += bonus;

        // Log transaction
        logsManager.log(this.userStore.profile.name, 'DAILY_BONUS', `Reçu ${bonus} card coin(s) pour bonus journalier.`);

        // Save
        await this.userStore.profile.save();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Bonus Journalier !',
          text: `+${bonus} card coin(s) ajoutés à votre compte.`,
          showConfirmButton: false,
          timer: 3000
        });

      } catch (e) {
        console.error("Error giving daily bonus", e);
      }
    },
    async checkOldCodes() {
      if( !this.ready || !this.userStore.isLoggedIn || !this.$route.meta.needAccount || !this.$route.meta.showNav ) return;

      // 0. Check profile for recent verification
      const stored = this.userStore.profile.oldCodesVerified;
      if (stored) {
        try {
           const { verified, expiry } = stored;
           if (verified && expiry > Date.now()) return;
        } catch (e) {
             console.error('Error parsing oldCodesVerified', e);
        }
      }

      if (!this.userStore.profile || !this.userStore.profile.name) return;

      // Check if user permanently refused heritage
      if (this.userStore.profile.oldCodeRefused) return;

      // 1. Check if user already used an old code
      if (this.userStore.profile.codes) {
        const hasUsedOld = Object.keys(this.userStore.profile.codes).some(k => k.startsWith('old'));
        if (hasUsedOld) {
          // If already used, mark as verified to stop checking
          this.userStore.profile.oldCodesVerified = { verified: true, expiry: Date.now() + 24 * 60 * 60 * 1000 };
          await this.userStore.profile.save();
          return;
        }
      }

      // 2. Normalize user name for comparison
      const userName = this.userStore.profile.name.toLowerCase().trim();

      // 3. Search for a match in oldCards
      let matchKey = Object.keys(oldCards).find(key => {
        const entry = oldCards[key];
        const fullName = `${entry.firstName} ${entry.lastName}`.toLowerCase().trim();
        return fullName === userName;
      });

      if (!matchKey) {
        matchKey = Object.keys(oldCards).find(key => {
          const entry = oldCards[key];
          const phone = entry.phone ? entry.phone.replace(/\D/g, '') : '';
          const userPhone = this.userStore.profile.phone ? this.userStore.profile.phone.replace(/\D/g, '') : '';
          return phone === userPhone && phone.length === 4;
        });
      }

      if (matchKey) {
        const entry = oldCards[matchKey];
        const ownerName = `${entry.firstName} ${entry.lastName}`.trim();

        await new Promise(resolve => setTimeout(resolve, 1000));

        const result = await Swal.fire({
          title: 'Héritage trouvé !',
          text: `Nous avons trouvé un ancien compte correspondant à votre nom (${ownerName}). Voulez-vous charger votre héritage maintenant ?`,
          icon: 'info',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Oui, récupérer !',
          denyButtonText: 'Ne plus proposer',
          cancelButtonText: 'Plus tard',
          confirmButtonColor: '#3085d6',
          denyButtonColor: '#d33',
          cancelButtonColor: '#aaa',
        });

        if (result.isConfirmed) {
          await this.applyOldCode(matchKey, entry);
        } else if (result.isDenied) {
          this.userStore.profile.oldCodeRefused = true;
          await this.userStore.profile.save();
        }
      }

      // Mark as verified for 24h to avoid repeating popups in the same session/day
      this.userStore.profile.oldCodesVerified = { verified: true, expiry: Date.now() + 24 * 60 * 60 * 1000 };
      await this.userStore.profile.save();
    },
    async applyOldCode(matchKey, entry) {
      const persistentCodeId = 'old' + Code.createId(matchKey);

      // Extract Rewards
      const isLegacy = Array.isArray(entry);
      const cardData = isLegacy ? entry : (entry.cards || {});
      const collectionList = isLegacy ? [] : (entry.collections || []);
      const stats = isLegacy ? {} : (entry.stats || {});

      if (!this.userStore.profile.cards) this.userStore.profile.cards = {};
      let totalCardsCount = 0;

      if (isLegacy) {
        totalCardsCount = cardData.length;
        cardData.forEach(cid => {
          if (!this.userStore.profile.cards[cid]) {
            this.userStore.profile.cards[cid] = { common: 0, silver: 0, golden: 0, foil: 0 };
          }
          this.userStore.profile.cards[cid].common += 1;
        });
      } else {
        for (const [cid, qty] of Object.entries(cardData)) {
          const quantity = parseInt(qty) || 0;
          if (quantity > 0) {
            totalCardsCount += quantity;
            if (!this.userStore.profile.cards[cid]) {
              this.userStore.profile.cards[cid] = { common: 0, silver: 0, golden: 0, foil: 0 };
            }
            this.userStore.profile.cards[cid].common += quantity;
          }
        }
      }

      // Give Collections
      if (collectionList.length > 0) {
        if (!this.userStore.profile.collections) this.userStore.profile.collections = {};
        collectionList.forEach(col => {
          this.userStore.profile.collections[col] = true;
        });
      }

      // Give Stats
      if (stats.open && stats.open > 0) {
        if (!this.userStore.profile.stats) this.userStore.profile.stats = {public: true, open: 0, destroy: 0, upgrades: 0, downgrades: 0 };
        this.userStore.profile.stats.open = (this.userStore.profile.stats.open || 0) + parseInt(stats.open);
      }

      // Generate Rewards Text
      let rewardsParts = [];
      if (totalCardsCount > 0) rewardsParts.push(`${totalCardsCount} Cartes (Classiques)`);
      if (collectionList.length > 0) rewardsParts.push(`${collectionList.length} Collection(s)`);
      if (stats.open && stats.open > 0) rewardsParts.push(`${stats.open} Booster(s) déjà ouvert(s)`);
      const rewardsString = rewardsParts.join(' + ');

      const ownerName = `${entry.firstName} ${entry.lastName}`.trim() || 'Ancien Propriétaire';

      // Mark code as used
      if (!this.userStore.profile.codes) this.userStore.profile.codes = {};
      this.userStore.profile.codes[persistentCodeId] = {
        date: Date.now(),
        code: matchKey,
        description: `Code de l'ancien temps (${ownerName})`,
        rewards: rewardsString
      };

      // Unlock Achievement: voyageur_du_temps
      if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};
      this.userStore.profile.achievements['voyageur_du_temps'] = true;
      
      notifManager.sendAchievementNotif(this.userStore.profile.id, 'voyageur_du_temps', 'Vous avez obtenues le succès "Voyageur du temps" !');

      await this.userStore.profile.save();
      achievementsManager.checkForAchievements();

      logsManager.log(this.userStore.profile.name, 'CODE', `Récupération automatique héritage : ${matchKey} (${ownerName}). Gains : ${rewardsString}`);

      Swal.fire({
        icon: 'success',
        title: 'Héritage Récupéré !',
        text: `Vous avez récupéré les biens de ${ownerName} : ${rewardsString}`,
        confirmButtonText: 'Parfait !'
      });
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    })
  },
}
</script>
