<template>
  <v-tooltip location="bottom">
    <template v-slot:activator="{ props }">
      <v-card v-bind="props" class="achievement-card mx-auto bg-background" :class="{ 'locked': !achievement.unlocked, 'elevation-4': achievement.unlocked }" height="280" width="280">
        <div class="achievement-content d-flex flex-column align-center justify-center h-100 pa-4 text-center">
          <div class="achievement-token mb-3" :class="achievement.unlocked ? achievement.rarity : ''" :style="{ '--booster-mask': `url('/achievements/${achievement.image}')` }">
            <v-img :src="`/achievements/${achievement.image}`" width="180" height="180" :class="{ 'grayscale-img': !achievement.unlocked }" contain></v-img>
          </div>
          <h4 class="mb-1 font-weight-regular text-truncate w-100">{{ achievement.title }}</h4>
        </div>
      </v-card>
    </template>

    <!-- Contenu du Tooltip -->
    <div class="text-center pa-2">
      <div class="font-weight-bold text-subtitle-1">{{ achievement.title }}</div>
      <div class="mb-2">{{ achievement.description }}</div>
      <v-chip color="primary" variant="outlined" size="small">
        <v-icon start icon="mdi-star"></v-icon>
        {{ achievement.points }} points
      </v-chip>
      <div class="mt-2 text-small-emphasis">
        ({{ rate }} des joueurs ont dévérouillé ce succès)
      </div>
    </div>
  </v-tooltip>
</template>

<script>
export default {
  name: 'AchievementItem',
  props: {
    achievement: {
      type: Object,
      required: true
    },
    rate: {
      type: String,
      default: '0%'
    }
  }
}
</script>
