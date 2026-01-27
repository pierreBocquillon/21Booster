<template>
  <div>
    <h1 class="text-center text-primary mb-8">Mes collections</h1>
    <div class="d-flex flex-wrap justify-center mt-5">
      <div v-for="collection in collections" :key="collection.id" class="ma-5 d-flex justify-center">
        <div class="book-container cursor-pointer position-relative" @click="$emit('select', collection)">
          <img :src="collection.pageImage ? '/collections_page/' + collection.pageImage : ''" class="book-image back-cover" aria-hidden="true" />
          <v-progress-linear :model-value="fullCompletion[collection.id].rate" color="error" rounded height="24" style="z-index: 10; rotate: -90deg; width:450px; height:24px; position:absolute; top:240px; left:50px; background-color:rgba(20, 5, 5, .7); box-shadow: rgba(0, 0, 0, 0.5) 0 0 20px 5px;">
            <span>
              {{ fullCompletion[collection.id].rate }}% ({{ fullCompletion[collection.id].owned }}/{{ fullCompletion[collection.id].total }})
            </span>
          </v-progress-linear>
          <v-progress-linear :model-value="completion[collection.id].rate" color="primary" rounded height="24" style="z-index: 10; rotate: -90deg; width:450px; height:24px; position:absolute; top:240px; left:80px; background-color:rgba(20, 5, 5, .7); box-shadow: rgba(0, 0, 0, 0.5) 0 0 20px 5px;">
            <span>
              {{ completion[collection.id].rate }}% ({{ completion[collection.id].owned }}/{{ completion[collection.id].total }})
            </span>
          </v-progress-linear>
          <img :src="collection.coverImage ? '/collections_cover/' + collection.coverImage : ''" class="book-image front-cover" :alt="collection.name" />
        </div>
      </div>
      <div v-if="collections.length === 0" class="text-center text-grey mt-10">
        <v-icon size="64" class="mb-2">mdi-bookshelf</v-icon>
        <p>Vous n'avez débloqué aucune collection pour le moment.</p>
      </div>
    </div>
  </div>
</template>

<script>
import Card from '@/classes/Card.js';
import { useUserStore } from '@/store/user.js'

export default {
  name: 'CollectionList',
  props: {
    collections: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      cards: [],
    }
  },
  emits: ['select'],
  mounted() {
    this.unsub.push(Card.listenAll((list) => {
      this.cards = list
    }))
  },
  computed: {
    fullCompletion() {
      const result = {};
      for (const collection of this.collections) {
        result[collection.id] = {
          rate: 0,
          owned: 0,
          total: 0
        };
        let collectionCards = this.cards.filter(card => card.collection && card.collection == collection.id);
        result[collection.id].total = collectionCards.length*4;

        if (collectionCards.length > 0) {
          collectionCards.forEach(card => {
            const uCard = this.userStore.profile.cards?.[card.id];
            if (uCard) {
              if (uCard.common > 0) result[collection.id].owned++;
              if (uCard.silver > 0) result[collection.id].owned++;
              if (uCard.golden > 0) result[collection.id].owned++;
              if (uCard.foil > 0) result[collection.id].owned++;
            }
          });
          result[collection.id].rate = Math.round((result[collection.id].owned / result[collection.id].total) * 100);
        }
      }
      return result;
    },
    completion() {
      const result = {};
      for (const collection of this.collections) {
        result[collection.id] = {
          rate: 0,
          owned: 0,
          total: 0
        };
        let collectionCards = this.cards.filter(card => card.collection && card.collection == collection.id);
        result[collection.id].total = collectionCards.length;

        if (collectionCards.length > 0) {
          collectionCards.forEach(card => {
            const uCard = this.userStore.profile.cards?.[card.id];
            if (uCard) {
              if (uCard.common > 0 || uCard.silver > 0 || uCard.golden > 0 || uCard.foil > 0) result[collection.id].owned++;
            }
          });
          result[collection.id].rate = Math.round((result[collection.id].owned / result[collection.id].total) * 100);
        }
      }
      return result;
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
