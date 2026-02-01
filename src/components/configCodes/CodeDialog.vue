<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800px" persistent>
    <v-card>
      <v-card-title class="text-h5 bg-primary text-white pa-4">
        {{ formTitle }}
      </v-card-title>

      <v-card-text class="pt-4">
        <v-container>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.name" label="Code (Nom)" :disabled="!!form.id"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model.number="form.amount" label="Quantité (Nb d'utilisations)" type="number"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field v-model="form.end" label="Date de fin" type="date"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.description" label="Description" rows="2"></v-textarea>
            </v-col>

            <v-col cols="12"><v-divider></v-divider></v-col>
            <v-col cols="12">
              <h3 class="text-h6 mb-2">Récompenses</h3>
            </v-col>

            <v-col cols="12">
              <v-text-field v-model.number="form.cash" label="Tokens" type="number" prepend-inner-icon="mdi-cash"></v-text-field>
            </v-col>

            <v-col cols="12">
              <h4 class="text-subtitle-1">Collections débloquées</h4>
              <v-select v-model="form.collections" :items="collections" item-title="name" item-value="id" label="Sélectionner des collections" multiple chips closable-chips clearable></v-select>
            </v-col>

            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-2">Boosters offerts</h4>
              <div v-for="(boosterItem, i) in form.boosters" :key="i" class="d-flex align-center gap-2 mb-2">
                <v-select v-model="boosterItem.id" :items="boosters" item-title="name" item-value="id" label="Booster" density="compact" hide-details class="flex-grow-1"></v-select>
                <v-text-field v-model.number="boosterItem.amount" label="Qté" type="number" min="1" density="compact" hide-details style="width: 100px;"></v-text-field>
                <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeBooster(i)"></v-btn>
              </div>
              <v-btn size="small" variant="tonal" color="primary" @click="addBooster">Ajouter un booster</v-btn>
            </v-col>

            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-2">Cartes offertes</h4>
              <div v-for="(cardItem, i) in form.cards" :key="i" class="d-flex align-center gap-2 mb-2 flex-wrap">
                <v-select v-model="cardItem.id" :items="cardOptions" item-title="title" item-value="id" label="Carte" density="compact" hide-details class="flex-grow-1" style="min-width: 250px;"></v-select>
                <v-select v-model="cardItem.rarity" :items="rarities" item-title="name" item-value="id" label="Rareté" density="compact" hide-details style="width: 150px;"></v-select>
                <v-text-field v-model.number="cardItem.amount" label="Qté" type="number" min="1" density="compact" hide-details style="width: 80px;"></v-text-field>
                <v-btn icon="mdi-delete" size="small" color="error" variant="text" @click="removeCard(i)"></v-btn>
              </div>
              <v-btn size="small" variant="tonal" color="primary" @click="addCard">Ajouter une carte</v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="$emit('update:modelValue', false)">
          Annuler
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="$emit('save', form)">
          Sauvegarder
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'CodeDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: true,
      default: () => ({})
    },
    boosters: {
      type: Array,
      default: () => []
    },
    cards: {
      type: Array,
      default: () => []
    },
    collections: {
      type: Array,
      default: () => []
    },
    rarities: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'save'],
  data() {
    return {
      form: {}
    }
  },
  methods: {
    addBooster() {
      if (!this.form.boosters) this.form.boosters = []
      this.form.boosters.push({ id: null, amount: 1 })
    },
    removeBooster(index) {
      this.form.boosters.splice(index, 1)
    },
    addCard() {
      if (!this.form.cards) this.form.cards = []
      this.form.cards.push({ id: null, amount: 1, rarity: 'common' })
    },
    removeCard(index) {
      this.form.cards.splice(index, 1)
    }
  },
  computed: {
    formTitle() {
      return this.form.id ? 'Modifier le code' : 'Nouveau code'
    },
    cardOptions() {
      return this.cards.map(card => {
        const collection = this.collections.find(c => c.id === card.collection);
        const collectionName = collection ? collection.name : 'Inconnue';
        return {
          id: card.id,
          title: `${card.number} - ${card.name} (${collectionName})`
        };
      });
    }
  },
  watch: {
    item: {
      handler(val) {
        this.form = JSON.parse(JSON.stringify(val)); // Deep copy to avoid reference issues
      },
      immediate: true,
      deep: true
    }
  }
}
</script>
