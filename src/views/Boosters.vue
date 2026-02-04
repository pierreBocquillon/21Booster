<template>
  <div class="pa-5" style="min-height: calc(100vh - 120px); height: 100%;">
    <div class="h-100">
      <v-card class="rounded-lg h-100">
        <v-card-text class="d-flex flex-column align-center h-100">

          <BoosterSelection v-if="!selectedBooster" :boosters="boosters" @select="selectBooster" />

          <BoosterOpening v-else :booster="selectedBooster" :cards="cards" :status="status" @skip="skipAnimation" @reset="resetBooster" @reopen="reopenBooster" />

        </v-card-text>
      </v-card>

    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import { useDataStore } from '@/store/data.js'
import Booster from '@/classes/Booster.js'
import Card from '@/classes/Card.js'
import Collection from '@/classes/Collection.js'
import achievementsManager from '@/assets/functions/achievementsManager.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import logsManager from '@/assets/functions/logsManager.js'
import BoosterSelection from '@/components/boosters/BoosterSelection.vue'
import BoosterOpening from '@/components/boosters/BoosterOpening.vue'
import Settings from '@/classes/Settings.js'
import notifManager from '../assets/functions/notifManager'
import Notif from '@/classes/Notif.js'

export default {
  components: {
    BoosterSelection,
    BoosterOpening
  },
  data() {
    return {
      notifsCleaned: false,
      unsub: [],
      userStore: useUserStore(),
      dataStore: useDataStore(),
      status: 'idle', // idle, opening, exploded, revealed
      selectedBooster: null,
      cards: [],
      boosters: [], // This will be the expanded inventory list
      timeouts: [],
    }
  },
  computed: {
    allBoosters() {
      return this.dataStore.boosters
    },
    allCards() {
      return this.dataStore.cards
    },
    collections() {
      return this.dataStore.collections
    },
    settings() {
      return this.dataStore.settings
    }
  },
  created() {
    Promise.all([
      this.dataStore.bindBoosters(),
      this.dataStore.bindCards(),
      this.dataStore.bindCollections(),
      this.dataStore.bindSettings()
    ]).then(() => {
      this.loadInventory();
    });

    if (this.userStore.profile) {
      this.deleteBoosterNotifs();
      this.notifsCleaned = true;
    }
  },
  watch: {
    'userStore.profile': {
      handler() {
        this.loadInventory();
        if (!this.notifsCleaned && this.userStore.profile) {
          this.deleteBoosterNotifs();
          this.notifsCleaned = true;
        }
      },
      deep: true
    },
    allBoosters() {
      this.loadInventory();
    },
    collections() {
      this.loadInventory();
    }
  },
  methods: {
    loadInventory() {
      this.boosters = [];
      if (!this.userStore.profile || !this.userStore.profile.boosters) return;

      // Iterate through user's booster inventory
      for (const [boosterId, amount] of Object.entries(this.userStore.profile.boosters)) {
        if (amount <= 0) continue;

        const boosterDef = this.allBoosters.find(b => b.id === boosterId);
        if (!boosterDef) continue;

        // Check if user has access to the collection
        if (this.userStore.profile.collections && this.userStore.profile.collections[boosterDef.collection] === true) {
          // Add single entry with count
          this.boosters.push({
            ...boosterDef,
            count: amount
          });
        }
      }

      // Sort by collection number, then booster size (number of cards), then name
      this.boosters.sort((a, b) => {
        const colA = this.collections.find(c => c.id === a.collection);
        const colB = this.collections.find(c => c.id === b.collection);
        const numColA = colA ? (colA.number || 0) : 0;
        const numColB = colB ? (colB.number || 0) : 0;

        if (numColA !== numColB) return numColA - numColB;
        if (a.collection !== b.collection) return (a.collection || '').localeCompare(b.collection || '');
        if (a.size !== b.size) return (a.size || 0) - (b.size || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
    },
    selectBooster(booster) {
      this.selectedBooster = booster;
      this.openBooster();
    },

    async openBooster() {
      if (this.status !== 'idle') return;
      if (!this.userStore.profile) return;
      if (!this.settings) {
        Swal.fire('Erreur', 'Paramètres non chargés.', 'error');
        return;
      }

      this.status = 'opening';

      // --- Logic Phase ---

      // 1. Get Cards for this collection
      const collectionCards = this.allCards.filter(c => c.collection === this.selectedBooster.collection);

      if (collectionCards.length === 0) {
        Swal.fire('Erreur', 'Aucune carte trouvée pour ce booster.', 'error');
        this.status = 'idle';
        this.selectedBooster = null;
        return;
      }

      // Group cards by their rarity (type property of the card)
      const availableCardsByRarity = {};
      collectionCards.forEach(card => {
        if (!availableCardsByRarity[card.type]) {
          availableCardsByRarity[card.type] = [];
        }
        availableCardsByRarity[card.type].push(card);
      });

      // Probabilities from settings (percentages)
      const typeRates = this.settings.typeDropRates || {
        'common': 100,
        'uncommon': 0,
        'rare': 0,
        'mythic': 0
      };

      const variantRates = this.settings.rarityDropRates || {
        'common': 100,
        'silver': 0,
        'golden': 0,
        'foil': 0
      };

      const generatedCards = [];
      const boosterSize = this.selectedBooster.size || 0;

      for (let i = 0; i < boosterSize; i++) {
        // A. Determine Rarity Slot based on rates and availability
        const availableRarities = Object.keys(availableCardsByRarity).filter(r => availableCardsByRarity[r].length > 0);
        if (availableRarities.length === 0) break;

        let totalRarityWeight = 0;
        availableRarities.forEach(r => {
          totalRarityWeight += (typeRates[r] || 0);
        });

        // If no weights match for available cards, default to equal chance among available
        let effectiveTypeRates = typeRates;
        if (totalRarityWeight === 0) {
          totalRarityWeight = availableRarities.length;
          effectiveTypeRates = {};
          availableRarities.forEach(r => effectiveTypeRates[r] = 1);
        }

        let rngRarity = Math.random() * totalRarityWeight;
        let selectedRarity = availableRarities[availableRarities.length - 1];

        for (const r of availableRarities) {
          rngRarity -= (effectiveTypeRates[r] || 0);
          if (rngRarity <= 0) {
            selectedRarity = r;
            break;
          }
        }

        // B. Pick a card from that rarity pool
        const pool = availableCardsByRarity[selectedRarity];
        const cardIndex = Math.floor(Math.random() * pool.length);
        const card = pool.splice(cardIndex, 1)[0];

        // C. Determine Variant (common, silver, golden, foil)
        const foilRate = variantRates.foil || 0;
        const goldenRate = variantRates.golden || 0;
        const silverRate = variantRates.silver || 0;

        let variant = 'common';
        let rngVariant = Math.random() * 100;

        if (rngVariant < foilRate) {
          variant = 'foil';
        } else if (rngVariant < (foilRate + goldenRate)) {
          variant = 'golden';
        } else if (rngVariant < (foilRate + goldenRate + silverRate)) {
          variant = 'silver';
        } else {
          variant = 'common';
        }

        generatedCards.push({
          ...card,
          originalType: card.type,
          frontImage: card.image,
          type: variant
        });
      }

      // 4. Update Profile (Inventory & Card Collection)
      try {
        // Remove booster
        if (this.userStore.profile.boosters[this.selectedBooster.id] > 0) {
          this.userStore.profile.boosters[this.selectedBooster.id]--;
        }

        // Add cards
        if (!this.userStore.profile.cards) this.userStore.profile.cards = {};

        generatedCards.forEach(card => {
          if (!this.userStore.profile.cards[card.id]) {
            this.userStore.profile.cards[card.id] = { common: 0, silver: 0, golden: 0, foil: 0 };
          }
          if ((this.userStore.profile.cards[card.id][card.type] || 0) === 0) {
            card.isNew = true;
          }
        });

        generatedCards.forEach(card => {
          this.userStore.profile.cards[card.id][card.type]++;
        });

        if (!this.userStore.profile.stats) {
          this.userStore.profile.stats = { public: true, open: 0, destroy: 0, upgrades: 0, downgrades: 0 };
        }
        this.userStore.profile.stats.open += 1;

        // Check for 'chanceux' achievement (Find a Foil)
        if (generatedCards.some(c => c.type === 'foil')) {
          if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};
          if (!this.userStore.profile.achievements['chanceux']) {
            this.userStore.profile.achievements['chanceux'] = true;
            notifManager.sendAchievementNotif(this.userStore.profile.id, 'chanceux', 'Vous avez obtenues le succès "Chanceux" !');
          }
        }

        logsManager.log(this.userStore.profile.name, 'OPEN', `Ouverture de booster ${this.selectedBooster.name}. Cartes obtenues: ${generatedCards.map(c => c.name + ' (' + c.type + ')').join(', ')}.`);

        await this.userStore.profile.save();

        this.loadInventory();
        achievementsManager.checkForAchievements();

      } catch (e) {
        console.error("Error saving profile", e);
        Swal.fire('Erreur', 'Une erreur est survenue lors de la sauvegarde.', 'error');
      }

      // 5. Prepare View Data
      generatedCards.sort((a, b) => {
        const rarityOrder = { 'foil': 3, 'golden': 2, 'silver': 1, 'common': 0 };
        if (a.type === b.type) {
          return a.name.localeCompare(b.name);
        } else {
          return rarityOrder[a.type] - rarityOrder[b.type];
        }
      });
      this.cards = generatedCards;

      // START PRELOADING HERE
      const imagePromises = generatedCards.map(card => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = Card.buildImageUrl(card.frontImage);
        });
      });

      // --- Animation Phase ---
      if (this.status !== 'opening') return;

      // Step 2: Shake animation (0.8s)
      this.timeouts.push(setTimeout(() => {
        this.status = 'exploded';

        // Step 3: Explode/Tear animation (0.8s) -> Then Reveal
        const explosionPromise = new Promise(resolve => setTimeout(resolve, 800));

        Promise.all([explosionPromise, ...imagePromises]).then(() => {
          if (this.status === 'exploded') {
            this.status = 'revealed';
            this.timeouts = [];
          }
        });
      }, 800));
    },
    skipAnimation() {
      if (this.status === 'opening' || this.status === 'exploded') {
        this.timeouts.forEach(t => clearTimeout(t));
        this.timeouts = [];
        this.status = 'revealed';
      }
    },
    resetBooster(cancel = false) {
      this.timeouts.forEach(t => clearTimeout(t));
      this.timeouts = [];
      this.status = 'idle';
      this.selectedBooster = null;
    },
    reopenBooster() {
      this.timeouts.forEach(t => clearTimeout(t));
      this.timeouts = [];
      this.status = 'idle';
      this.cards = [];
      this.openBooster();
    },
    async deleteBoosterNotifs() {
      if (!this.userStore.profile || !this.userStore.profile.id) return;
      try {
        const notifs = await Notif.getByUser(this.userStore.profile.id);
        const boosterNotifs = notifs.filter(n => n.type === 'BOOSTER');
        await Promise.all(boosterNotifs.map(n => n.delete()));
      } catch (e) {
        console.error("Error deleting booster notifs:", e);
      }
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    })
  },
}
</script>
