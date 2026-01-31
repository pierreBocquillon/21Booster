<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <div class="d-flex flex-row align-center justify-space-between">
        <div>&nbsp;</div>
        <h1 class="text-center text-primary mb-6">
          {{ customProfile ? 'Succés de ' + customProfile.name : 'Mes Succés' }}
        </h1>
        <v-btn icon="mdi-share-variant" variant="text" color="primary" @click="shareAchievements" title="Partager"></v-btn>
      </div>

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
import Swal from 'sweetalert2/dist/sweetalert2.js'

import notifManager from '@/assets/functions/notifManager.js'

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
      customProfile: null
    }
  },
  created() {
    this.initialize()
  },
  computed: {
    targetProfile() {
      return this.customProfile || this.userStore.profile || {};
    },
    achievements() {
      if (!this.targetProfile || !this.targetProfile.achievements) {
        return achievementsData.map(a => ({ ...a, unlocked: false }))
      }
      return achievementsData.map(a => ({
        ...a,
        unlocked: this.targetProfile.achievements[a.id] === true
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
    },
    async loadProfile(id) {
      if (id) {
        this.customProfile = await Profile.getById(id)
        
        // Achievement: Je suis une star
        if (this.customProfile && this.userStore.profile && this.userStore.profile.id !== this.customProfile.id) {
          if (!this.customProfile.achievements) this.customProfile.achievements = {}

          const achId = 'je_suis_une_star'
          if (!this.customProfile.achievements[achId]) {
            this.customProfile.achievements[achId] = true
            const achDef = achievementsData.find((a) => a.id === achId)
            const title = achDef ? achDef.title : 'Je suis une star'
            notifManager.sendAchievementNotif(this.customProfile.id, achId, `Vous avez obtenu le succès "${title}" !`)
            await this.customProfile.save()
          }
        }
      } else {
        this.customProfile = null
      }
    },
    shareAchievements() {
      const id = this.targetProfile.id;
      if (!id) return;

      const url = `${window.location.origin}/achievements/${id}`;

      navigator.clipboard.writeText(url).then(() => {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Lien copié dans le presse-papier',
          showConfirmButton: false,
          timer: 3000
        });
      }).catch(err => {
        console.error('Failed to copy: ', err);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de copier le lien',
        });
      });
    }
  },
  watch: {
    '$route.params.id': {
      handler(newId) {
        this.loadProfile(newId);
      },
      immediate: true
    },
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
