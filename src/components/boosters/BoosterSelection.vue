<template>
  <div>
    <h1 class="text-primary text-center mb-8">Choisissez votre Booster</h1>
    <div class="booster-deck d-flex justify-center align-center py-10" :style="{ '--deck-divisor': Math.max(1, boosters.length - 1) }">
      <div v-for="(booster, index) in boosters" :key="index" class="booster-choice cursor-pointer" :style="{ zIndex: index }" @click="$emit('select', booster)">
        <v-sheet class="bg-transparent overflow-hidden mb-4 transition-swing position-relative" width="360">
          <v-img :src="`/boosters/${booster.image}`" height="100%" cover></v-img>
          <v-chip v-if="booster.count > 1" color="primary" class="position-absolute mt-4 font-weight-bold" style="top: 10px; left: 50%; transform: translateX(-50%);" size="x-large" variant="flat" elevation="10">
            x{{ booster.count }}
          </v-chip>
        </v-sheet>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BoosterSelection',
  props: {
    boosters: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['select']
}
</script>
