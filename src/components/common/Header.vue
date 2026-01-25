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
          <v-btn icon variant="plain" v-bind="props">
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

          <v-list-item @click="logout">
            <div class="d-flex align-center">
                  <v-img height="42" width="42" src="/nav/quit.png"></v-img>
              <h3 class="w-100 font-weight-regular">Se déconnecter</h3>
            </div>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
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
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 text-primary text-center">
          21 Booster c'est quoi ?
        </v-card-title>
        <v-card-text>
          <div class="mb-4">
            <h3 class="text-primary my-2">L'expérience ultime de collection de cartes numériques.</h3>
            <p>Entrez dans l'univers de 21 Booster, la plateforme où la passion de la collection rencontre la stratégie. Ouvrez des paquets, gérez votre album et gravissez les échelons pour prouver au monde que vous êtes le collectionneur n°1.</p>
          </div>
          <v-divider></v-divider>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2">💎 1. L'Économie : Les Card Coins</h3>
            <p class="my-2">Les Card Coins sont le cœur de votre aventure. Ces jetons précieux constituent la monnaie unique de la plateforme.</p>
            <ul class="ml-4">
              <li><strong>Utilité :</strong> Ils sont indispensables pour acquérir de nouveaux boosters dans la boutique.</li>
              <li><strong>Obtention :</strong> Gagnez-en via le recyclage de cartes, les codes promos, ou en rechargeant votre solde auprès de l'un de nos vendeurs.</li>
            </ul>
          </div>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2">📦 2. Les Boosters : Le Frisson de l'Ouverture</h3>
            <p class="my-2">Rendez-vous dans la boutique pour échanger vos Coins contre des Boosters.</p>
            <ul class="ml-4">
              <li><strong>Découverte :</strong> Chaque ouverture est une surprise. Découvrez les cartes que vous avez obtenues.</li>
              <li><strong>Rareté :</strong> Croisez les doigts ! Certaines cartes sont communes, d'autres sont extrêmement rares. La chance sera-t-elle de votre côté ?</li>
            </ul>
            <v-expansion-panels class="my-2">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <strong>Voir les taux d'apparition :</strong>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-table>
                    <tbody>
                      <tr>
                        <th class="font-weight-bold">Rareté\Variante</th>
                        <th class="font-weight-bold">Classique</th>
                        <th class="font-weight-bold">Argent</th>
                        <th class="font-weight-bold">Or</th>
                        <th class="font-weight-bold">Foil</th>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Commune</th>
                        <td>{{Math.round((settings.rarityDropRates.common/100) * (settings.typeDropRates.common/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.silver/100) * (settings.typeDropRates.common/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.golden/100) * (settings.typeDropRates.common/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.foil/100) * (settings.typeDropRates.common/100) * 10000)/100 }}%</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Inhabituelle</th>
                        <td>{{Math.round((settings.rarityDropRates.common/100) * (settings.typeDropRates.uncommon/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.silver/100) * (settings.typeDropRates.uncommon/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.golden/100) * (settings.typeDropRates.uncommon/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.foil/100) * (settings.typeDropRates.uncommon/100) * 10000)/100 }}%</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Rare</th>
                        <td>{{Math.round((settings.rarityDropRates.common/100) * (settings.typeDropRates.rare/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.silver/100) * (settings.typeDropRates.rare/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.golden/100) * (settings.typeDropRates.rare/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.foil/100) * (settings.typeDropRates.rare/100) * 10000)/100 }}%</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Mythique</th>
                        <td>{{Math.round((settings.rarityDropRates.common/100) * (settings.typeDropRates.mythic/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.silver/100) * (settings.typeDropRates.mythic/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.golden/100) * (settings.typeDropRates.mythic/100) * 10000)/100 }}%</td>
                        <td>{{Math.round((settings.rarityDropRates.foil/100) * (settings.typeDropRates.mythic/100) * 10000)/100 }}%</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2">🗂️ 3. Gestion des collections, Forge et Cimetière</h3>
            <p class="my-2">L'onglet Collections est votre quartier général. C'est ici que vous admirez votre butin, mais c'est aussi un atelier stratégique pour gérer vos doublons.</p>
            <ul class="ml-4">
              <li><strong>Le Cimetière (Recyclage) :</strong> Vos cartes en double ne sont jamais perdues. "Sacrifiez-les" pour récupérer des Card Coins et acheter de nouveaux boosters.</li>
              <li><strong>La Forge (Fusion) :</strong> Ciblez l'excellence ! Combinez plusieurs exemplaires d'une même carte pour en forger une variante de qualité supérieure.</li>
            </ul>
            <v-expansion-panels class="my-2">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <strong>Voir les valeures de recyclage :</strong>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-table>
                    <tbody>
                      <tr>
                        <th class="font-weight-bold">Rareté\Variante</th>
                        <th class="font-weight-bold">Classique</th>
                        <th class="font-weight-bold">Argent</th>
                        <th class="font-weight-bold">Or</th>
                        <th class="font-weight-bold">Foil</th>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Commune</th>
                        <td>{{settings.rarityCash.common.common}}</td>
                        <td>{{settings.rarityCash.common.silver}}</td>
                        <td>{{settings.rarityCash.common.golden}}</td>
                        <td>{{settings.rarityCash.common.foil}}</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Inhabituelle</th>
                        <td>{{settings.rarityCash.uncommon.common}}</td>
                        <td>{{settings.rarityCash.uncommon.silver}}</td>
                        <td>{{settings.rarityCash.uncommon.golden}}</td>
                        <td>{{settings.rarityCash.uncommon.foil}}</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Rare</th>
                        <td>{{settings.rarityCash.rare.common}}</td>
                        <td>{{settings.rarityCash.rare.silver}}</td>
                        <td>{{settings.rarityCash.rare.golden}}</td>
                        <td>{{settings.rarityCash.rare.foil}}</td>
                      </tr>
                      <tr>
                        <th class="font-weight-bold">Mythique</th>
                        <td>{{settings.rarityCash.mythic.common}}</td>
                        <td>{{settings.rarityCash.mythic.silver}}</td>
                        <td>{{settings.rarityCash.mythic.golden}}</td>
                        <td>{{settings.rarityCash.mythic.foil}}</td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            
            <v-expansion-panels class="my-2">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <strong>Voir les ratios de conversion de la forge :</strong>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="pl-10">
                    <ul>
                      <li>
                        <strong>Ratios de conversion d'une upgrade : </strong>
                        {{ settings.upgradeCost }} pour 1
                      </li>
                      <li>
                        <strong>Ratios de conversion d'une downgrade : </strong>
                        {{ settings.downgradeCost }} pour 1
                      </li>
                    </ul>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2">🎁 4. Espace Codes</h3>
            <p class="my-2">Vous avez déniché un code secret ou reçu un cadeau ?</p>
            <p class="my-2">Entrez-le dans la section dédiée pour débloquer des récompenses immédiates : Boosters gratuits, cartes exclusives, nouvelles collections ou stocks de Card Coins. Restez à l'affût !</p>
          </div>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2">🏆 5. Compétition et Progression</h3>
            <p class="my-2">21 Booster n'est pas qu'une collection, c'est une compétition.</p>
            <ul class="ml-4">
              <li><strong>Les Succès :</strong> Relevez des défis spécifiques pour débloquer des bonus et afficher vos prouesses sur votre profil.</li>
              <li><strong>Vos Statistiques :</strong> Accédez à des données détaillées sur votre parcours. Partagez-les pour impressionner vos amis.</li>
              <li><strong>Le Classement :</strong> Comparez-vous à l'élite. Vous gagnez des points en : Collectionnant de nouvelles cartes, complétant des collections entières, validant des succès. </li>
            </ul>
            <p class="my-2">Objectif : Atteindre le sommet et devenir la Légende de 21 Booster.</p>
          </div>
          <v-divider></v-divider>
          <div class="my-4 mt-6">
            <h3 class="text-primary my-2 text-center">🛒 Besoin de plus de Coins ?</h3>
            <p class="my-2">Si vous êtes à court de ressources pour continuer votre collection, cliquez simplement sur votre solde de Card Coins. Afin de vous mettre en relation avec l'un de nos vendeurs.</p>
          </div>
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn color="primary" variant="text" @click="showHelpDialog = false">J'ai compris</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app-bar>
</template>
<script>
import { getAuth, signOut } from "firebase/auth"
import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'

import logsManager from '@/assets/functions/logsManager.js'
import notifManager from '@/assets/functions/notifManager.js'

import Salesman from '@/classes/Salesman.js'
import Settings from '@/classes/Settings.js'

import navItems from '@/config/navItems.js'

export default {
  data() {
    return {
      auth: getAuth(),
      userStore: useUserStore(),
      navItems,
      unsub: [],
      showSellersDialog: false,
      showHelpDialog: false,
      sellers: [],
      settings: new Settings(),
      unsubSellers: null,
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
    }))
  },
  beforeUnmount() {
    if (this.unsubSellers) this.unsubSellers()
  },
  watch: {
    'userStore.profile': {
      handler(newProfile) {
        setTimeout(() => {
          if (newProfile && !localStorage.getItem('helpSeen')) {
            this.showHelpDialog = true
            localStorage.setItem('helpSeen', 'true')
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
          else if (userPerms && tmp_item.permissions.every(p => userPerms.includes(p))) hasAccess = true

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
  },
  methods: {
    formatMoney(value) {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '').replace(",00", "")
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

            this.userStore.profile.collections = {};
            this.userStore.profile.boosters = {};
            this.userStore.profile.cards = {};
            this.userStore.profile.codes = {};
            this.userStore.profile.achievements = {};
            this.userStore.profile.stats = {
              public: true,
              open: 0,
              destroy: 0,
              upgrades: 0,
              downgrades: 0,
            };
            this.userStore.profile.cash = welcomeBonus;
            this.userStore.profile.oldCodeRefused = false;

            await this.userStore.profile.save();

            logsManager.log(this.userStore.profile.name, 'RESET', `Profil réinitialisé par l'utilisateur.`);

            sessionStorage.removeItem('oldCodesVerified');
            localStorage.removeItem('helpSeen');

            window.location.reload();
          }
        }
      });
    },
    logout() {
      signOut(getAuth()).then(() => {
        sessionStorage.removeItem('oldCodesVerified');
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