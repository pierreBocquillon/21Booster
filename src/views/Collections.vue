<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <CollectionList v-if="!selectedCollection" :collections="unlockedCollections" @select="selectCollection" />

      <CollectionDetails v-else :collection="selectedCollection" :cards="filteredCards" :stats="collectionStats" @back="selectedCollection = null" />
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Collection from '@/classes/Collection.js'
import Card from '@/classes/Card.js'
import CollectionList from '@/components/collections/CollectionList.vue'
import CollectionDetails from '@/components/collections/CollectionDetails.vue'

export default {
  components: {
    CollectionList,
    CollectionDetails
  },
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      collections: [],
      cards: [],
      selectedCollection: null
    }
  },
  computed: {
    unlockedCollections() {
      if (!this.userStore.profile || !this.userStore.profile.collections) return [];

      return this.collections.filter(c => {
        return this.userStore.profile.collections[c.id] === true;
      });
    },
    filteredCards() {
      if (!this.selectedCollection) return [];
      const collectionCards = this.cards.filter(card => card.collection === this.selectedCollection.id);

      return collectionCards.map(card => {
        const userCardData = (this.userStore.profile && this.userStore.profile.cards && this.userStore.profile.cards[card.id]) || {};

        return {
          ...card,
          amount: {
            common: userCardData.common || 0,
            silver: userCardData.silver || 0,
            golden: userCardData.golden || 0,
            foil: userCardData.foil || 0,
          }
        }
      });
    },
    collectionStats() {
      if (!this.filteredCards || this.filteredCards.length === 0) return { full: { owned: 0, total: 0, percent: 0 }, partial: { owned: 0, total: 0, percent: 0 } };

      let fullOwned = 0;
      let fullTotal = this.filteredCards.length * 4;
      let partialOwned = 0;
      let partialTotal = this.filteredCards.length;

      this.filteredCards.forEach(card => {
        if (card.amount.common > 0) fullOwned++;
        if (card.amount.silver > 0) fullOwned++;
        if (card.amount.golden > 0) fullOwned++;
        if (card.amount.foil > 0) fullOwned++;

        if (card.amount.common > 0 || card.amount.silver > 0 || card.amount.golden > 0 || card.amount.foil > 0) {
          partialOwned++;
        }
      });

      return {
        full: {
          owned: fullOwned, 
          total: fullTotal,
          percent: fullTotal === 0 ? 0 : (fullOwned / fullTotal) * 100
        },
        partial: {
          owned: partialOwned,
          total: partialTotal,
          percent: partialTotal === 0 ? 0 : (partialOwned / partialTotal) * 100
        }
      };
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
      this.unsub.push(Collection.listenAll((list) => {
        this.collections = list.sort((a, b) => (a.number || 0) - (b.number || 0));
        this.syncProfile();
        this.sortCards();
      }));
      this.unsub.push(Card.listenAll((list) => {
        this.cards = list;
        this.sortCards();
      }));
    },
    sortCards() {
      if (!this.cards.length) return;
      this.cards.sort((a, b) => {
        if (a.collection === b.collection) {
          return (parseInt(a.number) || 0) - (parseInt(b.number) || 0);
        }
        const colA = this.collections.find(c => c.id === a.collection);
        const colB = this.collections.find(c => c.id === b.collection);
        const numA = colA ? (colA.number || 0) : 0;
        const numB = colB ? (colB.number || 0) : 0;
        return numA - numB || a.collection.localeCompare(b.collection);
      });
    },
    async syncProfile() {
      if (!this.userStore.profile) return;
      if (!this.collections.length) return;

      let hasChanges = false;
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
    selectCollection(collection) {
      this.selectedCollection = collection;
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
