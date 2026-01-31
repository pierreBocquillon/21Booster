<template>
  <v-row class="mb-6">
    <!-- Progress -->
    <v-col cols="12" sm="6">
      <v-card class="pa-4 fill-height d-flex flex-column justify-center" elevation="2">
        <div class="d-flex justify-space-between mb-2">
          <span class="text-subtitle-1">Mes collections</span>
          <span class="text-h6 text-primary">{{ completion }}%</span>
        </div>
        <v-progress-linear :model-value="completion" color="primary" height="25" rounded striped>
          <strong>{{ completion }}%</strong>
        </v-progress-linear>
      </v-card>
    </v-col>

    <!-- Achievements Progress -->
    <v-col cols="12" sm="6">
      <v-card class="pa-4 fill-height d-flex flex-column justify-center" elevation="2">
        <div class="d-flex justify-space-between mb-2">
          <span class="text-subtitle-1">Succès Débloqués <v-btn color="error" icon variant="plain" @click="goToAchievements"><v-icon>mdi-link-variant</v-icon></v-btn></span>

          <span class="text-h6 text-orange">{{ achievements }}%</span>
        </div>
        <v-progress-linear :model-value="achievements" color="error" height="25" rounded striped>
          <strong>{{ achievements }}%</strong>
        </v-progress-linear>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: 'GlobalProgress',
  props: {
    completion: {
      type: Number,
      required: true,
      default: 0
    },
    achievements: {
      type: Number,
      required: true,
      default: 0
    }
  },
  methods: {
    goToAchievements() {
      this.$emit('go-to-achievements');
    }
  }
}
</script>
