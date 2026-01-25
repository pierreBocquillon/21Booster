<template>
  <div class="h-100 pa-4">
    <v-card class="h-100 rounded-xl pa-4" style="overflow-y: auto;">
      <h1 class="text-center text-primary mb-8">Boutique</h1>

      <ShopBoosterList :boosters="availableBoosters" :user-cash="userCash" @buy="openBuyDialog" />
    </v-card>

    <ShopBuyDialog v-model="buyDialog" :booster="selectedBooster" :user-cash="userCash" @confirm="handleBuyConfirm" />
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Booster from '@/classes/Booster.js'
import Collection from '@/classes/Collection.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import logsManager from '@/assets/functions/logsManager.js'
import ShopBoosterList from '@/components/shop/ShopBoosterList.vue'
import ShopBuyDialog from '@/components/shop/ShopBuyDialog.vue'

export default {
  components: {
    ShopBoosterList,
    ShopBuyDialog
  },
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      boosters: [],
      collections: [],
      buyDialog: false,
      selectedBooster: null
    }
  },
  computed: {
    userCash() {
      return this.userStore.profile?.cash || 0
    },
    availableBoosters() {
      // Filter only boosters that are available for purchase
      const filtered = this.boosters.filter(b => {
        if (!b.canBuy) return false

        // Check collection access
        const collection = this.collections.find(c => c.id === b.collection)
        if (!collection) return false

        if (this.userStore.profile) {
          // Logged in user: check profile permissions
          return this.userStore.profile.collections && this.userStore.profile.collections[b.collection] === true
        } else {
          // Guest: check if collection is public
          return collection.isPublic
        }
      });

      // Sort by collection number, then booster size (number of cards), then name
      return filtered.sort((a, b) => {
        const colA = this.collections.find(c => c.id === a.collection);
        const colB = this.collections.find(c => c.id === b.collection);
        const numColA = colA ? (colA.number || 0) : 0;
        const numColB = colB ? (colB.number || 0) : 0;

        if (numColA !== numColB) return numColA - numColB;
        if (a.collection !== b.collection) return (a.collection || '').localeCompare(b.collection || '');
        if (a.size !== b.size) return (a.size || 0) - (b.size || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
    }
  },
  watch: {
    'userStore.profile': {
      handler() {
        this.syncProfile();
      },
      deep: true
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    initialize() {
      this.unsub.push(Booster.listenAll((list) => {
        this.boosters = list;
      }));
      this.unsub.push(Collection.listenAll((list) => {
        this.collections = list;
        this.syncProfile();
      }));
    },
    async syncProfile() {
      if (!this.userStore.profile) return;

      if (!this.collections.length) return;

      let hasChanges = false;

      // Ensure collections object exists
      if (!this.userStore.profile.collections) {
        this.userStore.profile.collections = {};
        hasChanges = true;
      }

      this.collections.forEach(col => {
        const inProfile = this.userStore.profile.collections[col.id] !== undefined;
        const isPublic = col.isPublic;

        if (!inProfile) {
          this.userStore.profile.collections[col.id] = isPublic;
          hasChanges = true;
        } else {
          if (isPublic && this.userStore.profile.collections[col.id] !== true) {
            this.userStore.profile.collections[col.id] = true;
            hasChanges = true;
          }
        }
      });

      if (hasChanges) {
        try {
          await this.userStore.profile.save();
        } catch (e) {
          console.error("Error syncing profile collections:", e);
        }
      }
    },
    openBuyDialog(booster) {
      this.selectedBooster = booster
      this.buyDialog = true
    },
    handleBuyConfirm({ booster, quantity, free }) {
      this.buyBooster(booster, quantity, free)
      this.buyDialog = false
    },
    async buyBooster(booster, quantity, free) {
      if (!this.userStore.isLoggedIn || !this.userStore.profile) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Vous devez être connecté pour acheter.'
        })
        return
      }

      const price = booster.price * quantity

      if (this.userStore.profile.cash < price) {
        Swal.fire({
          icon: 'error',
          title: 'Pas assez d\'argent',
          text: `Il vous manque ${price - this.userStore.profile.cash} card coin(s) !`
        })
        return
      }

      try {
        // Deduct cash
        this.userStore.profile.cash -= price

        if (!this.userStore.profile.boosters) {
          this.userStore.profile.boosters = {}
        }
        if (!this.userStore.profile.boosters[booster.id]) {
          this.userStore.profile.boosters[booster.id] = 0
        }
        this.userStore.profile.boosters[booster.id] += quantity + free

        // Save profile
        await this.userStore.profile.save()

        logsManager.log(this.userStore.profile.name, 'BUY', `Acheté ${quantity + free} booster(s) ${booster.name} pour ${price} card coin(s).`);

        Swal.fire({
          icon: 'success',
          title: 'Achat effectué !',
          text: `Vous avez obtenu ${quantity + free} booster(s) ${booster.name}`,
          timer: 1500,
          showConfirmButton: false
        })

      } catch (e) {
        console.error("Erreur lors de l'achat:", e)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de l\'achat.'
        })
      }
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
