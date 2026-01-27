<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <h1 class="text-center text-primary mb-2">Mes succés</h1>

      <!-- Barre de progression -->
      <AchievementProgress :percentage="progressPercentage" :unlocked-count="unlockedCount" :total-count="achievements.length" :total-points="totalPoints" />

      <!-- Grille de succès -->
      <AchievementGrid :achievements="achievements" :all-profiles="allProfiles" />
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import achievementsData from '@/data/achievements.json'

import Profile from '@/classes/Profile.js'
import AchievementProgress from '@/components/achievements/AchievementProgress.vue'
import AchievementGrid from '@/components/achievements/AchievementGrid.vue'

export default {
  components: {
    AchievementProgress,
    AchievementGrid
  },
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      allProfiles: [],
    }
  },
  created() {
    this.initialize()
  },
  computed: {
    achievements() {
      if (!this.userStore.profile || !this.userStore.profile.achievements) {
        return achievementsData.map(a => ({ ...a, unlocked: false }))
      }
      return achievementsData.map(a => ({
        ...a,
        unlocked: this.userStore.profile.achievements[a.id] === true
      }))
    },
    unlockedCount() {
      return this.achievements.filter(a => a.unlocked).length;
    },
    totalPoints() {
      return this.achievements
        .filter(a => a.unlocked)
        .reduce((sum, a) => sum + a.points, 0);
    },
    progressPercentage() {
      if (this.achievements.length === 0) return 0;
      return Math.round((this.unlockedCount / this.achievements.length) * 100);
    }
  },
  methods: {
    initialize() {
      this.unsub.push(Profile.listenAll((list) => {
        this.allProfiles = list.filter(p => p.activated !== false && p.stats.public !== false);
      }))
    },
    async checkAndInitAchievements() {
      if (!this.userStore.profile) return

      let changed = false
      if (!this.userStore.profile.achievements) {
        this.userStore.profile.achievements = {}
        changed = true
      }

      achievementsData.forEach(a => {
        if (this.userStore.profile.achievements[a.id] === undefined) {
          this.userStore.profile.achievements[a.id] = false
          changed = true
        }
      })

      if (changed) {
        await this.userStore.profile.save()
      }
    }
  },
  watch: {
    'userStore.profile': {
      handler(newVal) {
        if (newVal) {
          this.checkAndInitAchievements()
        }
      },
      immediate: true
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
