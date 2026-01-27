<template>
  <div>
    <div class="d-flex align-center mb-1">
      <v-btn icon @click="$emit('back')" class="mr-4">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <h1 class="mr-3" style="white-space: nowrap;">{{ collection.name }}</h1>
      <v-spacer></v-spacer>
      <v-switch class="mx-5" label="Info toujours ON" color="primary" hide-details style="width: 100%; max-width: 180px; min-width: 100px" v-model="infoAlwaysOn"></v-switch>
      <v-select v-model="displayMode" :items="displayModes" item-title="title" item-value="value" density="compact" hide-details variant="outlined" style="width: 100%; max-width: 180px; min-width: 100px" prepend-inner-icon="mdi-eye" bg-color="surface"></v-select>
    </div>
    <div class="w-100 d-flex flex-column mb-4">
      <div class="d-flex flex-row">
        <v-progress-linear class="my-1" :model-value="Math.ceil(stats.partial.percent)" color="primary" height="24" rounded style="flex-grow:1; min-width:0; display:flex; align-items:center;">
          <strong style="width:100%; text-align:center;">{{ Math.ceil(stats.partial.percent) }}% : ({{ stats.partial.owned }}/{{ stats.partial.total }})</strong>
        </v-progress-linear>
        <div class="ml-2">
          <v-icon color="primary">mdi-help-circle-outline</v-icon>
          <v-tooltip activator="parent" location="top">
            <p>Collection partielle (Toutes les cartes)</p>
          </v-tooltip>
        </div>
      </div>
      <div class="d-flex flex-row">
        <v-progress-linear class="my-1" :model-value="Math.ceil(stats.full.percent)" color="error" height="24" rounded style="flex-grow:1; min-width:0; display:flex; align-items:center;">
          <strong style="width:100%; text-align:center;">{{ Math.ceil(stats.full.percent) }}% : ({{ stats.full.owned }}/{{ stats.full.total }})</strong>
        </v-progress-linear>
        <div class="ml-2">
          <v-icon color="error">mdi-help-circle-outline</v-icon>
          <v-tooltip activator="parent" location="top">
            <p>Collection complète (toutes les cartes dans toutes les variantes)</p>
          </v-tooltip>
        </div>
      </div>
    </div>

    <div class="d-flex flex-row flex-wrap justify-center align-center gap-4">
      <div v-for="card in cards" :key="card.id" class="d-flex justify-center align-center flex-wrap mb-6">
        <div class="ma-2 collection-card" :class="{ 'show-info': infoAlwaysOn }" @click="openPreview(card, getDisplayRarity(card))" :style="getDisplayRarity(card) === 'common' ? { '--booster-mask': `url('${currentImageUrl}')`, 'width': isLandscape(getCardImage(card, getDisplayRarity(card))) ? '25vw' : '30vh' } : { 'width': isLandscape(getCardImage(card, getDisplayRarity(card))) ? '25vw' : '30vh' }">
          <div :class="[(getDisplayRarity(card) !== 'common' && card.amount[getDisplayRarity(card)] > 0) ? getDisplayRarity(card) : '', { 'locked': card.amount[getDisplayRarity(card)] <= 0 }]" style="width: 100%; height: 100%;"><img :src="getCardImage(card, getDisplayRarity(card))" :alt="card.name" />
          </div>

          <div class="card-name d-flex flex-column align-center justify-center">
            <h5>
              {{ card.number }} - {{ isCardOwned(card) ? card.name : '???' }}
            </h5>
          </div>
          <div class="card-quantity d-flex flex-column align-center justify-center" z-index="50">
            <div>
              <v-chip :color="getTypeColor(card.type)" size="x-small" label variant="flat">
                {{ getTypeName(card.type) }}
              </v-chip>
            </div>
            <div class="d-flex flex-row align-center justify-center">
              <div class="mx-1 d-flex flex-column align-center justify-center" style="background: radial-gradient(#B2A278, #3f3d38); height: 38px; width: 38px; border-radius: 100%;">
                <span class="text-subtitle-2 text-black">x{{ card.amount.common }}</span>
              </div>
              <div class="mx-1 d-flex flex-column align-center justify-center" style="background: radial-gradient(#8ca3ad, #0b3344); height: 38px; width: 38px; border-radius: 100%;">
                <span class="text-subtitle-2 text-black">x{{ card.amount.silver }}</span>
              </div>
              <div class="mx-1 d-flex flex-column align-center justify-center" style="background: radial-gradient(#D7AD47, #3f2f09); height: 38px; width: 38px; border-radius: 100%;">
                <span class="text-subtitle-2 text-black">x{{ card.amount.golden }}</span>
              </div>
              <div class="mx-1 d-flex flex-column align-center justify-center" style="background: radial-gradient(#A167B2, #3c064c); height: 38px; width: 38px; border-radius: 100%;">
                <span class="text-subtitle-2 text-black">x{{ card.amount.foil }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="cards.length === 0">
        <p class="text-center text-grey">Aucune carte dans cette collection.</p>
      </div>
    </div>

    <CardPreview v-model="cardDialog" :card="previewCard" :rarity="previewRarity" :imageUrl="previewImageUrl" />
  </div>
</template>

<script>
import CardPreview from './CardPreview.vue';

export default {
  name: 'CollectionDetails',
  components: { CardPreview },
  props: {
    collection: { type: Object, required: true },
    cards: { type: Array, required: true },
    stats: { type: Object, required: true }
  },
  emits: ['back'],
  data() {
    return {
      cardDialog: false,
      previewCard: null,
      previewRarity: null,
      infoAlwaysOn: false,
      displayMode: 'best',
      displayModes: [
        { title: 'Meilleure', value: 'best' },
        { title: 'Classique', value: 'common' },
        { title: 'Silver', value: 'silver' },
        { title: 'Golden', value: 'golden' },
        { title: 'Foil', value: 'foil' },
      ],
      types: [
        { title: 'Commun', value: 'common', color: 'grey-darken-1' },
        { title: 'Inhabituel', value: 'uncommon', color: 'green-darken-1' },
        { title: 'Rare', value: 'rare', color: 'blue-darken-1' },
        { title: 'Mythique', value: 'mythic', color: 'purple-darken-1' },
      ],
    }
  },
  computed: {
    previewImageUrl() {
      if (!this.previewCard || !this.previewRarity) return '';
      return this.getCardImage(this.previewCard, this.previewRarity);
    }
  },
  methods: {
    getTypeName(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.title : typeValue;
    },
    getTypeColor(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.color : 'grey';
    },
    getCardImage(card, type) {
      if (card.amount[type] > 0) {
        return '/cards/' + card.image;
      }
      return '/collections_card/' + this.collection.cardImage;
    },
    openPreview(card, rarity) {
      if (card.amount[rarity] <= 0) return;
      this.previewCard = card;
      this.previewRarity = rarity;
      this.cardDialog = true;
    },
    isLandscape(currentImageUrl) {
      const img = new Image();
      img.src = currentImageUrl;
      return img.width > img.height;
    },
    getDisplayRarity(card) {
      if (this.displayMode === 'best') return this.getBestRarity(card);
      return this.displayMode;
    },
    getBestRarity(card) {
      if (card.amount.foil > 0) return 'foil';
      if (card.amount.golden > 0) return 'golden';
      if (card.amount.silver > 0) return 'silver';
      return 'common';
    },
    isCardOwned(card) {
      return (card.amount.common + card.amount.silver + card.amount.golden + card.amount.foil) > 0;
    }
  }
}
</script>
