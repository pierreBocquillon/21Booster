<template>
  <v-dialog v-model="dialog" max-width="600px" scrollable>
    <v-card class="rounded-xl">
      <v-card-title class="d-flex justify-space-between align-center pa-4">
        <span class="text-h5 text-primary font-weight-bold">Notes de mise à jour</span>
        <v-btn icon variant="text" @click="dialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>

      <v-card-text class="pa-4" style="max-height: 60vh;">
        <div v-for="(note, index) in patchNotes" :key="index" class="mb-6">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3 class="text-h6 font-weight-bold">v{{ note.version }}</h3>
            <span class="text-caption text-grey">{{ formatDate(note.date) }}</span>
          </div>
          <ul class="pl-4">
            <li v-for="(change, i) in note.changes" :key="i" class="mb-1">
              {{ change }}
            </li>
          </ul>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="dialog = false">
          Fermer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import patchNotesData from '@/data/patchNotes.json'

export default {
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: ['update:modelValue'],
  computed: {
    dialog: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    patchNotes() {
      return patchNotesData
    }
  },
  methods: {
    formatDate(dateString) {
        if (!dateString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    }
  }
}
</script>
