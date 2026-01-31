<template>
  <div class="mt-5 d-flex flex-column align-center justify-center h-100">
    <v-text-field v-model="search" label="Rechercher un utilisateur" prepend-inner-icon="mdi-magnify" variant="outlined" hide-details single-line class="mb-4 w-100" style="max-width: 800px;"></v-text-field>

    <v-data-table :headers="filteredheaders" :items="users" :search="search" no-data-text="Aucun utilisateur" items-per-page="-1" hide-default-footer>
      <template v-slot:bottom />

      <template v-slot:item.check="{ item }">
        <v-switch v-if="item.activated && item.stats && userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))" v-model="item.stats.public" @change="togglePublic(item)" color="primary" density="compact" hide-details />
        <span v-else-if="!item.activated && userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))"><v-icon color="error">mdi-handcuffs</v-icon></span>
      </template>

      <template v-slot:item.name="{ item }">
        <span v-if="item.activated">{{ item.name }}</span>
        <span v-else class="text-error">{{ item.name }}</span>
      </template>

      <template v-slot:item.phone="{ item }">
        <span v-if="item.activated">555-{{ item.phone }}</span>
        <span v-else class="text-error">555-{{ item.phone }}</span>
      </template>

      <template v-slot:item.permissions="{ item }">
        <span v-if="item.activated && item.permissions && item.permissions.length > 0">
          <v-tooltip location="top" content-class="bg-background" text="string" v-for="perm in item.permissions">
            <template v-slot:activator="{ props }">
              <span v-bind="props" class="mx-1 text-h5">{{allPermissions.find(p => p.value === perm)?.icon}}</span>
            </template>
            <h4>{{allPermissions.find(p => p.value === perm)?.name}}</h4>
          </v-tooltip>
        </span>
        <span v-else-if="!item.activated">
          <v-icon color="error">mdi-handcuffs</v-icon>
        </span>
        <span v-else>Aucune</span>
      </template>

      <template v-slot:item.cash="{ item }">
        <div v-if="item.activated" class="d-inline-flex align-center font-weight-bold">
          <v-img src="/card-coin.png" height="20" width="20" class="mr-2" contain></v-img>
          x {{ formatMoney(item.cash) }}
        </div>
        <div v-else-if="!item.activated">
          <v-icon color="error">mdi-handcuffs</v-icon>
        </div>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn icon color="accent" variant="text" @click="addToken(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'seller'].includes(p))">
          <v-icon>mdi-cash-multiple</v-icon>
          <v-tooltip activator="parent" location="top">Donner des card coins</v-tooltip>
        </v-btn>
        <v-btn icon color="indigo" variant="text" @click="openGiveCard(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'seller'].includes(p))">
          <v-icon>mdi-cards-playing-club</v-icon>
          <v-tooltip activator="parent" location="top">Donner une carte</v-tooltip>
        </v-btn>
        <v-btn icon color="pink" variant="text" @click="openGiveBoosters(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'seller'].includes(p))">
          <v-icon>mdi-cards-playing</v-icon>
          <v-tooltip activator="parent" location="top">Donner des boosters</v-tooltip>
        </v-btn>
        <v-btn icon color="success" variant="text" @click="openSetCollections(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'seller'].includes(p))">
          <v-icon>mdi-book-open-page-variant</v-icon>
          <v-tooltip activator="parent" location="top">Gérer les collections</v-tooltip>
        </v-btn>
        <v-btn icon color="cyan" variant="text" @click="editItem(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))">
          <v-icon>mdi-pencil</v-icon>
          <v-tooltip activator="parent" location="top">Modifier l'utilisateur</v-tooltip>
        </v-btn>
        <v-btn icon color="pink" variant="text" @click="deleteItem(item)" v-if="!item.activated && this.userStore.profile.permissions.some(p => ['dev'].includes(p))">
          <v-icon>mdi-trash-can</v-icon>
          <v-tooltip activator="parent" location="top">Effacer l'utilisateur</v-tooltip>
        </v-btn>
        <v-btn icon color="primary" variant="text" @click="resetPassword(item)" v-if="this.userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))">
          <v-icon>mdi-lock-reset</v-icon>
          <v-tooltip activator="parent" location="top">Réinitialiser le mot de passe</v-tooltip>
        </v-btn>
        <v-btn icon color="error" variant="text" @click="banUser(item)" v-if="item.activated && this.userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))">
          <v-icon>mdi-gavel</v-icon>
          <v-tooltip activator="parent" location="top">Bannir</v-tooltip>
        </v-btn>
        <v-btn icon color="error" variant="text" @click="unbanUser(item)" v-if="!item.activated && this.userStore.profile.permissions.some(p => ['dev', 'moderator'].includes(p))">
          <v-icon>mdi-thumb-up</v-icon>
          <v-tooltip activator="parent" location="top">Débannir</v-tooltip>
        </v-btn>
        <v-btn icon color="purple" variant="text" @click="exportUser(item)" v-if="this.userStore.profile.permissions.some(p => ['dev'].includes(p))">
          <v-icon>mdi-package-down</v-icon>
          <v-tooltip activator="parent" location="top">Exporter le profil</v-tooltip>
        </v-btn>
        <v-btn icon color="pink" variant="text" @click="wipeItem(item)" v-if="this.userStore.profile.permissions.some(p => ['dev'].includes(p))">
          <v-icon>mdi-eraser</v-icon>
          <v-tooltip activator="parent" location="top">Wipe l'utilisateur</v-tooltip>
        </v-btn>
        <v-btn icon color="error" variant="text" @click="fullProfile(item)" v-if="this.userStore.profile.permissions.some(p => ['dev'].includes(p))">
          <v-icon>mdi-emoticon-devil</v-icon>
          <v-tooltip activator="parent" location="top">Profil complet</v-tooltip>
        </v-btn>
      </template>

    </v-data-table>
    <div class="d-flex align-center justify-center">
      <v-btn class="mt-10 mx-1" color="primary" variant="tonal" @click="openGiveaway"><v-icon class="mr-2">mdi-cards-playing-diamond-multiple-outline</v-icon>Distribution</v-btn>
      <v-btn class="mt-10 mx-1" color="purple" variant="tonal" @click="loadProfile"><v-icon class="mr-2">mdi-package-up</v-icon>Charger un profile</v-btn>
    </div>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Modifier un utilisateur</v-card-title>
        <v-card-text>
          <h3 class="mb-3">{{ currentUser.name }}</h3>
          <v-select label="Permissions" v-model="currentUser.permissions" :items="myPermissions" item-title="fullname" item-value="value" multiple>
            <template v-slot:selection="{ item, index }">
              <div>
                <h3 class="font-weight-regular">{{ item.raw.icon }}</h3>
              </div>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="addItem">{{ currentUser.id ? 'Modifier' : 'Ajouter' }}</v-btn>
          <v-btn text @click="closeUserDialog">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="boosterDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Donner des boosters</v-card-title>
        <v-card-text>
          <h3 class="mb-3" v-if="currentBoosterUser">{{ currentBoosterUser.name }}</h3>
          <v-select label="Booster" v-model="selectedBooster" :items="availableBoosters" item-title="name" item-value="id">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="'( ' + item.raw.size + ' Cartes )'"></v-list-item>
            </template>
          </v-select>
          <v-text-field label="Quantité" v-model.number="boosterQuantity" type="number" min="1"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="giveBoosters">Envoyer</v-btn>
          <v-btn text @click="boosterDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="collectionDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Gérer les collections</v-card-title>
        <v-card-text>
          <h3 class="mb-3" v-if="currentCollectionUser">{{ currentCollectionUser.name }}</h3>
          <div v-if="currentCollectionUser && currentCollectionUser.collections">
            <v-list density="compact">
              <v-list-item v-for="collection in allCollections" :key="collection.id">
                <template v-slot:prepend>
                  <v-switch v-model="currentCollectionUser.collections[collection.id]" color="primary" :readonly="collection.isPublic" hide-details density="compact" class="mr-5"></v-switch>
                </template>
                <v-list-item-title>{{ collection.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="collection.isPublic">(Publique)</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="saveCollections">Enregistrer</v-btn>
          <v-btn text @click="collectionDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="giveCardDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline">Donner une carte</v-card-title>
        <v-card-text>
          <h3 class="mb-3" v-if="currentGiveCardUser">{{ currentGiveCardUser.name }}</h3>
          <v-select label="Collection" v-model="selectedGiveCardCollection" :items="allCollections" item-title="name" item-value="id" @change="selectedGiveCardCard = null"></v-select>
          <v-select label="Carte" v-model="selectedGiveCardCard" :items="filteredCards" item-title="name" item-value="id" :disabled="!selectedGiveCardCollection">
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.number + ' - ' + item.raw.name"></v-list-item>
            </template>
          </v-select>
          <v-select label="Rareté" v-model="selectedGiveCardRarity" :items="rarities" item-title="title" item-value="value"></v-select>
          <v-text-field label="Quantité" v-model.number="giveCardQuantity" type="number" min="1"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="giveCard">Envoyer</v-btn>
          <v-btn text @click="giveCardDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="giveawayDialog" max-width="800px">
      <v-card>
        <v-card-title class="headline">Distribution Collective</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select label="Utilisateurs" v-model="selectedGiveawayUsers" :items="users" item-title="name" item-value="id" multiple chips closable-chips clearable></v-select>
            </v-col>
            
            <v-col cols="12">
              <h3 class="mb-2">Récompenses</h3>
              <v-divider class="mb-4"></v-divider>
            </v-col>

            <!-- Card Coins -->
            <v-col cols="12" sm="6">
              <v-text-field label="Card Coins" v-model.number="giveawayCash" type="number" min="0">
                <template v-slot:prepend-inner>
                  <v-img src="/card-coin.png" height="24" width="24" class="mr-2" contain></v-img>
                </template>
              </v-text-field>
            </v-col>

            <!-- Boosters -->
            <v-col cols="12" sm="6">
              <v-select label="Booster" v-model="selectedGiveawayBooster" :items="boosters" item-title="name" item-value="id" clearable>
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="'( ' + item.raw.size + ' Cartes )'"></v-list-item>
                </template>
              </v-select>
              <v-text-field v-if="selectedGiveawayBooster" label="Quantité de boosters" v-model.number="giveawayBoosterQuantity" type="number" min="1"></v-text-field>
            </v-col>

            <!-- Collections -->
            <v-col cols="12">
              <v-select label="Déverrouiller des collections" v-model="selectedGiveawayCollections" :items="allCollections" item-title="name" item-value="id" multiple chips closable-chips></v-select>
            </v-col>

            <!-- Single Card -->
            <v-col cols="12">
              <v-card variant="outlined" class="pa-4">
                <v-card-subtitle class="pl-0">Donner une carte spécifique</v-card-subtitle>
                <v-row class="mt-2 text-center">
                  <v-col cols="12" sm="6">
                    <v-select label="Collection" v-model="selectedGiveawayCardCollection" :items="allCollections" item-title="name" item-value="id" clearable @update:model-value="selectedGiveawayCard = null"></v-select>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-select label="Carte" v-model="selectedGiveawayCard" :items="giveawayFilteredCards" item-title="name" item-value="id" :disabled="!selectedGiveawayCardCollection">
                      <template v-slot:item="{ props, item }">
                        <v-list-item v-bind="props" :title="item.raw.number + ' - ' + item.raw.name"></v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-select label="Rareté" v-model="selectedGiveawayCardRarity" :items="rarities" item-title="title" item-value="value"></v-select>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <v-text-field label="Quantité" v-model.number="giveawayCardQuantity" type="number" min="1"></v-text-field>
                  </v-col>
                </v-row>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="giveaway" :disabled="selectedGiveawayUsers.length === 0">Distribuer</v-btn>
          <v-btn text @click="giveawayDialog = false">Annuler</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { getFunctions, httpsCallable } from 'firebase/functions'

import { useUserStore } from '@/store/user.js'

import permissions from '@/config/permissions.js'
import achievementsData from '@/data/achievements.json'

import Profile from '@/classes/Profile.js'
import Booster from '@/classes/Booster.js'
import Card from '@/classes/Card.js'
import Collection from '@/classes/Collection.js'
import logsManager from '@/assets/functions/logsManager.js'
import notifManager from '@/assets/functions/notifManager.js'
import achievementsManager from '@/assets/functions/achievementsManager.js'
import Settings from '@/classes/Settings.js'

export default {
  data() {
    return {
      unsub: [],
      functions: getFunctions(),
      userStore: useUserStore(),
      headers: [
        { title: 'Public', key: 'check', sortable: false, align: 'start' },
        { title: 'Nom', key: 'name', sortable: true, align: 'start' },
        { title: 'numéro', key: 'phone', sortable: true, align: 'start' },
        { title: 'Permissions', key: 'permissions', sortable: true, align: 'start' },
        { title: 'Token', key: 'cash', sortable: true, align: 'start' },
        { title: '', key: 'actions', sortable: false, align: 'end' },
      ],
      allPermissions: permissions,
      users: [],
      search: '',

      dialog: false,
      currentUser: null,

      boosterDialog: false,
      currentBoosterUser: null,
      selectedBooster: null,
      boosterQuantity: 1,
      boosters: [],

      collectionDialog: false,
      currentCollectionUser: null,
      allCollections: [],

      giveCardDialog: false,
      currentGiveCardUser: null,
      selectedGiveCardCollection: null,
      selectedGiveCardCard: null,
      selectedGiveCardRarity: 'common',
      giveCardQuantity: 1,
      allCards: [],
      rarities: [
        { title: 'Classique', value: 'common' },
        { title: 'Argent', value: 'silver' },
        { title: 'Or', value: 'golden' },
        { title: 'Foil', value: 'foil' }
      ],

      giveawayDialog: false,
      selectedGiveawayUsers: [],
      giveawayCash: 0,
      selectedGiveawayBooster: null,
      giveawayBoosterQuantity: 1,
      selectedGiveawayCollections: [],
      selectedGiveawayCardCollection: null,
      selectedGiveawayCard: null,
      selectedGiveawayCardRarity: 'common',
      giveawayCardQuantity: 1,
    }
  },
  mounted() {
    this.unsub.push(Profile.listenAll(users => {
      this.users = users.map(user => {
        if (!user.stats) user.stats = {}
        if (user.stats.public === undefined) user.stats.public = true
        return user
      })
    }))
  },
  computed: {
    filteredheaders() {
      let tmp_headers = JSON.parse(JSON.stringify(this.headers))
      if(this.userStore.profile.permissions.includes('dev')) {
        return tmp_headers
      } 

      let keys = ['name','phone','cash','actions']

      if(this.userStore.profile.permissions.includes('moderator')) {
        keys.push('permissions')
        keys.push('check')
      }

      return tmp_headers.filter(h => keys.includes(h.key))
    },
    myPermissions() {
      let permissions = []
      for (let perm of this.allPermissions) {
        if (this.userStore.profile.permissions.includes(perm.value) || this.userStore.profile.permissions.includes('dev') || this.userStore.profile.permissions.includes('admin')) {
          permissions.push(perm)
        }
      }
      return permissions
    },
    availableBoosters() {
      if (!this.currentBoosterUser || !this.currentBoosterUser.collections) return []
      return this.boosters.filter(b => this.currentBoosterUser.collections[b.collection] === true)
    },
    filteredCards() {
      if (!this.selectedGiveCardCollection) return []
      let cards = this.allCards.filter(c => c.collection === this.selectedGiveCardCollection)
      cards.sort((a, b) => {return parseInt(a.number) - parseInt(b.number)})
      console.log(cards)
      return cards
    },
    giveawayFilteredCards() {
      if (!this.selectedGiveawayCardCollection) return []
      let cards = this.allCards.filter(c => c.collection === this.selectedGiveawayCardCollection)
      cards.sort((a, b) => {return parseInt(a.number) - parseInt(b.number)})
      return cards
    }
  },
  methods: {
    formatMoney(value) {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value).replace('€', '').replace(",00", "")
    },
    async wipeItem(item) {
      Swal.fire({
        title: 'Effacer les données utilisateur',
        text: `Êtes-vous sûr de vouloir effacer toutes les données de "${item.name}" ? Cette action est irréversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, effacer',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          let settings = await Settings.getById("general")
          const welcomeBonus = settings ? settings.welcomeBonus : 500

          item.cash = 0
          item.collections = {}
          item.boosters = {}
          item.cards = {}
          item.codes = {}
          item.achievements = {}
          item.stats.open = 0
          item.stats.destroy = 0
          item.stats.upgrades = 0
          item.stats.downgrades = 0
          item.cash = welcomeBonus
          item.oldCodeRefused = false
          item.lastWheelSpin = 0
          item.helpSeen = false
          item.oldCodesVerified = null

          await item.save()
        }
      })
    },
    async deleteItem(item) {
      Swal.fire({
        title: 'Effacer l\'utilisateur',
        text: `Êtes-vous sûr de vouloir effacer l'utilisateur "${item.name}" ? Cette action est irréversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui, effacer',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          await item.delete()
        }
      })
    },
    async resetPassword(user) {
      Swal.fire({
        title: 'Confirmer la réinitialisation',
        text: `Êtes-vous sûr de vouloir réinitialiser le mot de passe de "${user.name}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Oui',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          const chars =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
            "abcdefghijklmnopqrstuvwxyz" +
            "0123456789"

          let password = ""
          for (let i = 0; i < 24; i++) {
              const randomIndex = Math.floor(Math.random() * chars.length)
              password += chars[randomIndex]
          }
          let tmp_password = password
          
          httpsCallable(this.functions, 'changePassword')({
            userId: user.id,
            hash: btoa(tmp_password),
          })
          .then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: `Mot de passe réinitialisé avec succès. Nouveau mot de passe temporaire : ${tmp_password} (En validant, il sera copié dans votre presse-papier.)`,
            }).then(() => {
              logsManager.log(this.userStore.profile.name, 'PASSWORD', `Réinitialisation du mot de passe de ${user.name}.`);
              navigator.clipboard.writeText(tmp_password)
            })
          })
          .catch(error => {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.',
              timer: 3000,
            })
          })
        }
      })
    },
    closeUserDialog() {
      this.dialog = false
    },
    async addItem() {
      if (!this.currentUser || !this.currentUser.name) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez remplir tous les champs correctement.',
          timer: 3000,
        })
        return
      }

      this.currentUser.permissions.sort((a, b) => {
        const permAIndex = this.allPermissions.findIndex(p => p.value === a)
        const permBIndex = this.allPermissions.findIndex(p => p.value === b)
        return permAIndex - permBIndex
      })

      await this.currentUser.save()
      this.closeUserDialog()

      let permString = ''

      if (this.currentUser.permissions.length > 0) {
        for (let perm of this.currentUser.permissions) {
          let permObj = this.allPermissions.find(p => p.value === perm)
          if (permObj) {
            permString += permObj.icon + ' '
          }
        }
      } else {
        permString = 'Aucune'
      }

      logsManager.log(this.userStore.profile.name, "MODERATION", `A modifié les permissions de ${this.currentUser.name} : ${permString}`)
      
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Utilisateur sauvegardé avec succès.',
        timer: 3000,
      })
    },
    async openGiveCard(item) {
      this.currentGiveCardUser = item
      this.giveCardDialog = true

      if (this.allCards.length === 0) {
        this.allCards = await Card.getAll()
      }
      if (this.allCollections.length === 0) {
        this.allCollections = await Collection.getAll()
      }
    },
    async giveCard() {
      if (!this.selectedGiveCardCard || this.giveCardQuantity <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez sélectionner une carte et une quantité valide.',
          timer: 3000,
        })
        return
      }

      if (!this.currentGiveCardUser.cards) {
        this.currentGiveCardUser.cards = {}
      }

      if (!this.currentGiveCardUser.cards[this.selectedGiveCardCard]) {
        this.currentGiveCardUser.cards[this.selectedGiveCardCard] = {
          common: 0,
          silver: 0,
          golden: 0,
          foil: 0
        }
      }

      this.currentGiveCardUser.cards[this.selectedGiveCardCard][this.selectedGiveCardRarity] += this.giveCardQuantity

      await this.currentGiveCardUser.save()
      
      // If the admin is giving cards to themselves, check for achievements
      if (this.currentGiveCardUser.id === this.userStore.profile.id) {
        achievementsManager.checkForAchievements()
      }

      let card = this.allCards.find(c => c.id === this.selectedGiveCardCard)
      
      let cardName = card?.name || "Inconnu"
      let rarityName = this.rarities.find(r => r.value === this.selectedGiveCardRarity)?.title || "Inconnue"

      logsManager.log(this.userStore.profile.name, "TRANSACTION", `A ajouté ${this.giveCardQuantity}x carte "${cardName}" (${rarityName}) à ${this.currentGiveCardUser.name}`)
      let cardSent = {}
      cardSent[this.selectedGiveCardCard] = {
        amount: this.giveCardQuantity,
        rarity: this.selectedGiveCardRarity
      }
      await notifManager.sendCardNotif(this.currentGiveCardUser.id, cardSent, (this.userStore.profile.name + ' vous a envoyé ' + this.giveCardQuantity + ' carte(s).'))

      this.giveCardDialog = false
      this.selectedGiveCardCollection = null
      this.selectedGiveCardCard = null
      this.selectedGiveCardRarity = 'common'
      this.giveCardQuantity = 1

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Carte(s) envoyée(s) avec succès.',
        timer: 3000,
      })
    },
    async openGiveBoosters(item) {
      this.currentBoosterUser = item
      this.boosterDialog = true

      if (this.boosters.length === 0) {
        this.boosters = await Booster.getAll()
      }

      let collections = await Collection.getAll()
      let hasChange = false
      if (!this.currentBoosterUser.collections) {
        this.currentBoosterUser.collections = {}
        hasChange = true
      }

      for (let collection of collections) {
        if (this.currentBoosterUser.collections[collection.id] === undefined) {
          this.currentBoosterUser.collections[collection.id] = collection.isPublic
          hasChange = true
        } else if (collection.isPublic && this.currentBoosterUser.collections[collection.id] !== true) {
          this.currentBoosterUser.collections[collection.id] = true
          hasChange = true
        }
      }

      if (hasChange) {
        await this.currentBoosterUser.save()
      }
    },
    async giveBoosters() {
      if (!this.selectedBooster || this.boosterQuantity <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Veuillez sélectionner un booster et une quantité valide.',
          timer: 3000,
        })
        return
      }

      if (!this.currentBoosterUser.boosters) {
        this.currentBoosterUser.boosters = {}
      }

      if (this.currentBoosterUser.boosters[this.selectedBooster]) {
        this.currentBoosterUser.boosters[this.selectedBooster] += this.boosterQuantity
      } else {
        this.currentBoosterUser.boosters[this.selectedBooster] = this.boosterQuantity
      }

      await this.currentBoosterUser.save()

      let boosterName = this.boosters.find(b => b.id === this.selectedBooster)?.name || "Inconnu"
      logsManager.log(this.userStore.profile.name, "TRANSACTION", `A ajouté ${this.boosterQuantity}x booster "${boosterName}" à ${this.currentBoosterUser.name}`)
      await notifManager.sendBoosterNotif(this.currentBoosterUser.id, {[this.selectedBooster]: this.boosterQuantity}, (this.userStore.profile.name + ' vous a envoyé ' + this.boosterQuantity + ' booster(s).'))

      this.boosterDialog = false
      this.selectedBooster = null
      this.boosterQuantity = 1

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Boosters envoyés avec succès.',
        timer: 3000,
      })
    },
    async openSetCollections(item) {
      this.currentCollectionUser = item
      this.allCollections = await Collection.getAll()

      // Sync collections on the user object for the dialog model
      if (!this.currentCollectionUser.collections) {
        this.currentCollectionUser.collections = {}
      }

      this.allCollections.forEach(col => {
        if (this.currentCollectionUser.collections[col.id] === undefined) {
          this.currentCollectionUser.collections[col.id] = col.isPublic;
        } else if (col.isPublic && this.currentCollectionUser.collections[col.id] !== true) {
          this.currentCollectionUser.collections[col.id] = true;
        }
      });

      this.collectionDialog = true
    },
    async saveCollections() {
      await this.currentCollectionUser.save()

      achievementsManager.checkForAchievements();
      
      logsManager.log(this.userStore.profile.name, "TRANSACTION", `A modifié les accès aux collections de ${this.currentCollectionUser.name}`)

      this.collectionDialog = false

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Collections mises à jour avec succès.',
        timer: 3000,
      })
    },
    addToken(item) {
      Swal.fire({
        title: `Ajouter du sang à ${item.name}`,
        input: 'number',
        inputLabel: 'Quantité de sang à ajouter',
        inputAttributes: {
          min: 1,
          step: 1,
        },
        showCancelButton: true,
        confirmButtonText: 'Ajouter',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          const amount = parseInt(result.value)
          if (isNaN(amount) || amount <= 0) {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Veuillez entrer une quantité valide.',
              timer: 3000,
            })
            return
          }

          item.cash += amount
          await item.save()

          logsManager.log(this.userStore.profile.name, "TRANSACTION", `A ajouté ${amount} card coin(s) à ${item.name}`)
          await notifManager.sendCashNotif(item.id, amount, (this.userStore.profile.name + ' vous a envoyé ' + amount + ' card coin(s).'))

          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: `Ajouté ${amount} card coin(s) à ${item.name}.`,
            timer: 3000,
          })
        }
      })
    },
    editItem(item) {
      this.currentUser = item
      this.dialog = true
    },
    banUser(item) {
      Swal.fire({
        title: 'Bannir l\'utilisateur',
        text: `Êtes-vous sûr de vouloir bannir "${item.name}" ? Cela désactivera son compte.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Oui, bannir',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.activated = false
          await item.save()

          logsManager.log(this.userStore.profile.name, "MODERATION", `A banni l'utilisateur ${item.name}`)

          Swal.fire({
            icon: 'success',
            title: 'Banni',
            text: `L'utilisateur ${item.name} a été banni avec succès.`,
            timer: 3000,
          })
        }
      })
    },
    unbanUser(item) {
      Swal.fire({
        title: 'Debannir l\'utilisateur',
        text: `Êtes-vous sûr de vouloir debannir "${item.name}" ? Cela réactivera son compte.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Oui, débannir',
        cancelButtonText: 'Annuler',
      }).then(async (result) => {
        if (result.isConfirmed) {
          item.activated = true
          await item.save()

          logsManager.log(this.userStore.profile.name, "MODERATION", `A débanni l'utilisateur ${item.name}`)

          Swal.fire({
            icon: 'success',
            title: 'Débanni',
            text: `L'utilisateur ${item.name} a été débanni avec succès.`,
            timer: 3000,
          })
        }
      })
    },
    exportUser(item) {
      // Export user data as JSON
      const userData = JSON.stringify(item, null, 2)
      const blob = new Blob([userData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${item.name}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
    async openGiveaway(){
      this.selectedGiveawayUsers = []
      this.giveawayCash = 0
      this.selectedGiveawayBooster = null
      this.giveawayBoosterQuantity = 1
      this.selectedGiveawayCollections = []
      this.selectedGiveawayCardCollection = null
      this.selectedGiveawayCard = null
      this.selectedGiveawayCardRarity = 'common'
      this.giveawayCardQuantity = 1

      if (this.allCards.length === 0) {
        this.allCards = await Card.getAll()
      }
      if (this.allCollections.length === 0) {
        this.allCollections = await Collection.getAll()
      }
      if (this.boosters.length === 0) {
        this.boosters = await Booster.getAll()
      }

      this.giveawayDialog = true
    },
    async giveaway(){
      if (this.selectedGiveawayUsers.length === 0) return

      const result = await Swal.fire({
        title: 'Confirmer la distribution',
        text: `Voulez-vous vraiment distribuer ces récompenses à ${this.selectedGiveawayUsers.length} utilisateur(s) ?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Oui, distribuer',
        cancelButtonText: 'Annuler'
      })

      if (!result.isConfirmed) return

      Swal.fire({
        title: 'Distribution en cours...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      try {
        for (const userId of this.selectedGiveawayUsers) {
          const user = this.users.find(u => u.id === userId)
          if (!user) continue

          // Cash
          if (this.giveawayCash > 0) {
            user.cash += this.giveawayCash
          }

          // Booster
          if (this.selectedGiveawayBooster && this.giveawayBoosterQuantity > 0) {
            if (!user.boosters) user.boosters = {}
            user.boosters[this.selectedGiveawayBooster] = (user.boosters[this.selectedGiveawayBooster] || 0) + this.giveawayBoosterQuantity
          }

          // Collections
          if (this.selectedGiveawayCollections.length > 0) {
            if (!user.collections) user.collections = {}
            this.selectedGiveawayCollections.forEach(colId => {
              user.collections[colId] = true
            })
          }

          // Card
          if (this.selectedGiveawayCard && this.giveawayCardQuantity > 0) {
            if (!user.cards) user.cards = {}
            if (!user.cards[this.selectedGiveawayCard]) {
              user.cards[this.selectedGiveawayCard] = { common: 0, silver: 0, golden: 0, foil: 0 }
            }
            user.cards[this.selectedGiveawayCard][this.selectedGiveawayCardRarity] += this.giveawayCardQuantity
          }

          await user.save()
          
          if (user.id === this.userStore.profile.id) {
            achievementsManager.checkForAchievements()
          }
        }

        let summary = `A effectué une distribution collective à ${this.selectedGiveawayUsers.length} utilisateurs : `
        let changes = []
        if (this.giveawayCash > 0) changes.push(`${this.giveawayCash} cash`)
        if (this.selectedGiveawayBooster) {
          let bName = this.boosters.find(b => b.id === this.selectedGiveawayBooster)?.name || "booster inconnu"
          changes.push(`${this.giveawayBoosterQuantity}x booster ${bName}`)
        }
        if (this.selectedGiveawayCollections.length > 0) changes.push(`${this.selectedGiveawayCollections.length} collection(s) déverrouillée(s)`)
        if (this.selectedGiveawayCard) {
          let cName = this.allCards.find(c => c.id === this.selectedGiveawayCard)?.name || "carte inconnue"
          changes.push(`${this.giveawayCardQuantity}x card ${cName} (${this.selectedGiveawayCardRarity})`)
        }
        
        logsManager.log(this.userStore.profile.name, "TRANSACTION", summary + changes.join(', '))

        for (const userId of this.selectedGiveawayUsers) {
          const user = this.users.find(u => u.id === userId)
          if (!user) continue

          let notifParts = []
          if (this.giveawayCash > 0){
            await notifManager.sendCashNotif(user.id, this.giveawayCash, (this.userStore.profile.name + ' vous a envoyé ' + this.giveawayCash + ' card coin(s).'))
          }
          if (this.selectedGiveawayBooster) {
            await notifManager.sendBoosterNotif(user.id, {[this.selectedGiveawayBooster]: this.giveawayBoosterQuantity}, (this.userStore.profile.name + ' vous a envoyé ' + this.giveawayBoosterQuantity + ' booster(s).'))
          }
          if (this.selectedGiveawayCard) {
            let cardSent = {}
            cardSent[this.selectedGiveawayCard] = {
              amount: this.giveawayCardQuantity,
              rarity: this.selectedGiveawayCardRarity
            }
            await notifManager.sendCardNotif(user.id, cardSent, (this.userStore.profile.name + ' vous a envoyé ' + this.giveawayCardQuantity + ' carte(s).'))
          }
        }

        this.giveawayDialog = false
        Swal.fire({
          icon: 'success',
          title: 'Distribution réussie',
          text: `La distribution pour ${this.selectedGiveawayUsers.length} utilisateurs a été effectuée.`,
          timer: 3000
        })
      } catch (error) {
        console.error("Giveaway error:", error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la distribution.',
          timer: 3000
        })
      }
    },
    loadProfile() {
      //ask for a json file
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = async (event) => {
          try {
            const userData = JSON.parse(event.target.result)
            
            this.userStore.profile.cash = userData.cash 
            this.userStore.profile.collections = userData.collections 
            this.userStore.profile.boosters = userData.boosters 
            this.userStore.profile.cards = userData.cards 
            this.userStore.profile.codes = userData.codes 
            this.userStore.profile.achievements = userData.achievements 
            this.userStore.profile.stats = userData.stats 
            this.userStore.profile.lastLogin = userData.lastLogin 
            await this.userStore.profile.save()

            Swal.fire({
              icon: 'success',
              title: 'Succès',
              text: `Le profil de ${this.userStore.profile.name} a été importé avec succès.`,
              timer: 3000,
            })
          } catch (error) {
            console.error("Error loading profile", error)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: 'Le fichier sélectionné est invalide ou corrompu.',
              timer: 3000,
            })
          }
        }
        reader.readAsText(file)
      }
      input.click()

    },
    async togglePublic(item) {
      await item.save()
      const status = item.stats.public ? 'public' : 'privé'
      logsManager.log(this.userStore.profile.name, "MODERATION", `A passé le profil de ${item.name} en ${status}`)
    },
    async fullProfile(item) {
      const result = await Swal.fire({
        title: 'Confirmation',
        text: `Voulez-vous vraiment débloquer tout le contenu pour ${item.name} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, tout débloquer !',
        cancelButtonText: 'Annuler'
      })

      if (result.isConfirmed) {
        // Obtenir toutes les données nécessaires
        const [collections, boosters, cards] = await Promise.all([
          Collection.getAll(),
          Booster.getAll(),
          Card.getAll()
        ])

        // Débloquer collections
        if (!item.collections) item.collections = {}
        collections.forEach(c => {
          item.collections[c.id] = true
        })

        // Tout les succès
        if (!item.achievements) item.achievements = {}
        achievementsData.forEach(a => {
          item.achievements[a.id] = true
        })

        // Ajouter boosters
        if (!item.boosters) item.boosters = {}
        boosters.forEach(b => {
          item.boosters[b.id] = (item.boosters[b.id] || 0) + 100
        })

        // Ajouter cartes (toutes les variantes)
        if (!item.cards) item.cards = {}
        cards.forEach(c => {
          if (!item.cards[c.id]) {
            item.cards[c.id] = { common: 0, silver: 0, golden: 0, foil: 0 }
          }
          item.cards[c.id].common += 10
          item.cards[c.id].silver += 10
          item.cards[c.id].golden += 10
          item.cards[c.id].foil += 10
        })

        // Ajouter cash
        item.cash += 100000

        await item.save()
        
        if (item.id === this.userStore.profile.id) {
          achievementsManager.checkForAchievements()
        }

        logsManager.log(this.userStore.profile.name, "MODERATION", `A débloqué le profil complet de ${item.name}`)

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Le profil de ${item.name} a été mis à jour avec succès.`,
          timer: 3000
        })
      }
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub == 'function') {
        unsub()
      }
    })
  },
}
</script>