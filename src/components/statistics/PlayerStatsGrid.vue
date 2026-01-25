<template>
  <div>
    <h2 class="text-h5 mb-4">Statistiques du Joueur</h2>
    <v-row class="mb-8">
      <v-col v-for="(stat, index) in stats" :key="index" cols="6" md="2">
        <v-card class="pa-3 text-center h-100" color="primary" variant="outlined">
          <v-icon :icon="stat.icon" color="primary" size="large" class="mb-2"></v-icon>
          <div class="text-h5 text-light font-weight-bold">{{ stat.value }}</div>
          <div class="text-caption text-light text-wrap" style="line-height: 1.2;">{{ stat.label }}</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'PlayerStatsGrid',
  props: {
    stats: {
      type: Array,
      required: true,
      default: () => []
    }
  }
}
</script>
