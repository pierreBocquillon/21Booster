<template>
  <div class="mb-8 px-4">
    <div class="d-flex justify-space-between mb-2">
      <span class="text-subtitle-1 font-weight-bold">Progression globale</span>
      <span class="text-subtitle-1 font-weight-bold text-primary">{{ percentage }}%</span>
    </div>
    <v-progress-linear :model-value="percentage" color="error" height="20" rounded striped>
      <template v-slot:default="{ value }">
        <strong>{{ Math.ceil(value) }}%</strong>
      </template>
    </v-progress-linear>
    <div class="text-center mt-2 text-medium-emphasis">
      {{ unlockedCount }} / {{ totalCount }} Succès débloqués ({{ totalPoints }} pts)
    </div>
  </div>
</template>

<script>
export default {
  name: 'AchievementProgress',
  props: {
    percentage: {
      type: Number,
      required: true,
      default: 0
    },
    unlockedCount: {
      type: Number,
      required: true,
      default: 0
    },
    totalCount: {
      type: Number,
      required: true,
      default: 0
    },
    totalPoints: {
      type: Number,
      required: true,
      default: 0
    }
  }
}
</script>
