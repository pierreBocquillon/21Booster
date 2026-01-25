<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <div class="d-flex flex-row align-center justify-space-between">
        <div>&nbsp;</div>
        <h1 class="text-center text-primary mb-6">
          {{ customProfile ? 'Statistiques de ' + customProfile.name : 'Mes Statistiques' }}
        </h1>
        <v-btn icon="mdi-share-variant" variant="text" color="primary" @click="shareStats" title="Partager"></v-btn>
      </div>

      <GlobalProgress :completion="completion.my" :achievements="achievementsStats.percentage" />

      <PlayerStatsGrid :stats="playerStats" />

      <v-divider class="mb-8"></v-divider>

      <CollectionBreakdown :collections="collectionBreakdown" />

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Collection from '@/classes/Collection.js'
import Card from '@/classes/Card.js'
import Profile from '@/classes/Profile.js'
import achievementsData from '@/data/achievements.json'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import GlobalProgress from '@/components/statistics/GlobalProgress.vue'
import PlayerStatsGrid from '@/components/statistics/PlayerStatsGrid.vue'
import CollectionBreakdown from '@/components/statistics/CollectionBreakdown.vue'

export default {
  components: {
    GlobalProgress,
    PlayerStatsGrid,
    CollectionBreakdown
  },
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      allCollections: [],
      allCards: [],
      customProfile: null
    }
  },
  computed: {
    targetProfile() {
      return this.customProfile || this.userStore.profile || {};
    },
    // Current user's stats object (or empty)
    userStats() {
      return this.targetProfile.stats || {};
    },
    // Filter out only unlocked collections
    myCollections() {
      if (!this.targetProfile.collections) return [];
      return this.allCollections.filter(c => this.targetProfile.collections[c.id] === true);
    },
    // --- Global Completion Stats ---
    completion() {
      if (!this.allCards.length) return { my: 0, total: 0 };

      // 1. Total (All collections)
      const totalSlots = this.allCards.length * 4; // 4 variants per card
      let ownedSlots = 0;

      // 2. My (Unlocked collections only)
      const myCollectionIds = this.myCollections.map(c => c.id);
      const myCards = this.allCards.filter(c => myCollectionIds.includes(c.collection));
      const myTotalSlots = myCards.length * 4;
      let myOwnedSlots = 0;

      const userCards = this.targetProfile.cards || {};

      this.allCards.forEach(card => {
        const userCard = userCards[card.id];

        // Check each variant
        ['common', 'silver', 'golden', 'foil'].forEach(r => {
          if (userCard && userCard[r] > 0) {
            ownedSlots++;
            if (myCollectionIds.includes(card.collection)) {
              myOwnedSlots++;
            }
          }
        });
      });

      return {
        total: totalSlots > 0 ? Math.round((ownedSlots / totalSlots) * 100) : 0,
        my: myTotalSlots > 0 ? Math.round((myOwnedSlots / myTotalSlots) * 100) : 0
      };
    },
    // --- Achievements Stats ---
    achievementsStats() {
      const total = achievementsData.length;
      if (total === 0) return { count: 0, percentage: 0 };

      // Count how many defined achievements are unlocked in profile
      const userAchievements = this.targetProfile.achievements || {};
      const unlockedCount = achievementsData.filter(ach => userAchievements[ach.id] === true).length;

      return {
        count: unlockedCount,
        percentage: Math.round((unlockedCount / total) * 100)
      };
    },
    // --- Generic Player Stats ---
    playerStats() {
      const s = this.userStats;
      // Count used codes
      const codesCount = this.targetProfile.codes ? Object.keys(this.targetProfile.codes).length : 0;

      return [
        { label: 'Collections Débloquées', value: this.myCollections.length, icon: 'mdi-book-open-page-variant' },
        { label: 'Boosters Ouverts', value: s.open || 0, icon: 'mdi-cards-playing-outline' },
        { label: 'Cartes Détruites', value: s.destroy || 0, icon: 'mdi-grave-stone' },
        { label: 'Upgrades', value: s.upgrades || 0, icon: 'mdi-arrow-up-bold-circle-outline' },
        { label: 'Downgrades', value: s.downgrades || 0, icon: 'mdi-arrow-down-bold-circle-outline' },
        { label: 'Codes Utilisés', value: codesCount, icon: 'mdi-ticket-percent' },
      ];
    },
    // --- Detailed Breakdown ---
    collectionBreakdown() {
      // Only unlocked collections
      return this.myCollections.map(col => {
        const colCards = this.allCards.filter(c => c.collection === col.id);
        const totalCards = colCards.length;

        const stats = { common: 0, silver: 0, golden: 0, foil: 0 };

        if (totalCards > 0) {
          colCards.forEach(card => {
            const uCard = this.targetProfile.cards?.[card.id];
            if (uCard) {
              if (uCard.common > 0) stats.common++;
              if (uCard.silver > 0) stats.silver++;
              if (uCard.golden > 0) stats.golden++;
              if (uCard.foil > 0) stats.foil++;
            }
          });
        }

        const s = {
          common: totalCards > 0 ? Math.round((stats.common / totalCards) * 100) : 0,
          silver: totalCards > 0 ? Math.round((stats.silver / totalCards) * 100) : 0,
          golden: totalCards > 0 ? Math.round((stats.golden / totalCards) * 100) : 0,
          foil: totalCards > 0 ? Math.round((stats.foil / totalCards) * 100) : 0,
          // Global completion for this collection
          total: totalCards > 0 ? Math.round(((stats.common + stats.silver + stats.golden + stats.foil) / (totalCards * 4)) * 100) : 0
        };

        return {
          ...col,
          stats: s
        };
      });
    }
  },
  watch: {
    '$route.params.id': {
      handler(newId) {
        this.loadProfile(newId);
      },
      immediate: true
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    initialize() {
      this.unsub.push(Collection.listenAll((list) => {
        this.allCollections = list.sort((a, b) => {
          if (a.number !== b.number) return (a.number || 0) - (b.number || 0);
          return (a.name || '').localeCompare(b.name || '');
        });
      }))
      this.unsub.push(Card.listenAll((list) => {
        this.allCards = list;
      }));
    },
    async loadProfile(id) {
      if (id) {
        this.customProfile = await Profile.getById(id);
      } else {
        this.customProfile = null;
      }
    },
    shareStats() {
      const id = this.targetProfile.id;
      if (!id) return;

      const url = `${window.location.origin}/statistics/${id}`;

      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Lien copié dans le presse-papier',
          showConfirmButton: false,
          timer: 3000
        });
      }).catch(err => {
        console.error('Failed to copy: ', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de copier le lien',
        });
      });
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
