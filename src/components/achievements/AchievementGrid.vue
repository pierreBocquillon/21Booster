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
    allProfiles: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    getAchievementRate(achievement) {
      if (!this.allProfiles || this.allProfiles.length === 0) return '0%'
      const count = this.allProfiles.filter(p => p.achievements && p.achievements[achievement.id] === true).length
      return Math.round((count / this.allProfiles.length) * 100) + '%'
    }
  }
}
</script>
