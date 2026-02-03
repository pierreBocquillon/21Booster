<template>
  <div class="d-flex flex-wrap justify-center align-center ga-4 pa-2 mx-auto" style="max-width: 1200px;">
    <div v-for="achievement in achievements" :key="achievement.id">
      <AchievementItem :achievement="achievement" :rate="getAchievementRate(achievement)" />
    </div>
  </div>
</template>

<script>
import AchievementItem from './AchievementItem.vue'

export default {
  name: 'AchievementGrid',
  components: {
    AchievementItem
  },
  props: {
    achievements: {
      type: Array,
      required: true,
      default: () => []
    },
    rates: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    getAchievementRate(achievement) {
      if (!this.rates || !this.rates[achievement.id]) return '0%'
      return this.rates[achievement.id]
    }
  }
}
</script>
