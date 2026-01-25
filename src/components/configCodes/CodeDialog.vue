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

            <v-col cols="12" md="6">
              <v-text-field v-model.number="form.cash" label="Tokens" type="number"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select v-model="form.collection" :items="collections" item-title="name" item-value="id" label="Collection débloquée" clearable></v-select>
            </v-col>

            <v-col cols="12" md="8">
              <v-select v-model="form.booster" :items="boosters" item-title="name" item-value="id" label="Booster offert" clearable></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-text-field v-model.number="form.boosterAmount" label="Qté" type="number" min="1"></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select v-model="form.card" :items="cardOptions" item-title="title" item-value="id" label="Carte offerte" clearable></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="form.cardRarity" :items="rarities" item-title="name" item-value="id" label="Rareté" clearable></v-select>
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field v-model.number="form.cardAmount" label="Qté" type="number" min="1"></v-text-field>
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
          title: `${card.number} - ${card.name} ( ${collectionName} )`
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
