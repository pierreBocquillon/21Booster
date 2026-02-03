<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <div class="d-flex align-center justify-center mb-4">
        <h1 class="text-primary mr-2">Classement</h1>
        <v-tooltip location="bottom">
          <template v-slot:activator="{ props }">
            <v-icon v-bind="props" icon="mdi-help-circle-outline" class="text-medium-emphasis cursor-pointer"></v-icon>
          </template>
          <div class="pa-2">
            <div><strong>Règles de calcul des points :</strong></div>
            <div class="mt-1">• Classique : {{ pointsConfig.common }} pts</div>
            <div class="mt-1">• Silver : {{ pointsConfig.silver }} pts</div>
            <div class="mt-1">• Gold : {{ pointsConfig.gold }} pts</div>
            <div class="mt-1">• Foil : {{ pointsConfig.foil }} pts</div>
            <div class="mt-2"><strong>Bonus Collection :</strong></div>
            <div>Multiplicateur +{{ settings.collectionMultiplier }} par collection complète (par rareté)</div>
            <div class="mt-2 text-caption font-italic2">* Les cartes en double ne sont pas prises en compte.</div>
          </div>
        </v-tooltip>
      </div>

      <v-table>
        <thead>
          <tr>
            <th class="text-left">Rang</th>
            <th class="text-left">Joueur</th>
            <th class="text-left">Classique ({{ pointsConfig.common }}pts)</th>
            <th class="text-left">Silver ({{ pointsConfig.silver }}pts)</th>
            <th class="text-left">Gold ({{ pointsConfig.gold }}pts)</th>
            <th class="text-left">Foil ({{ pointsConfig.foil }}pts)</th>
            <th class="text-left">Succès</th>
            <th class="text-left">Score Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(player, index) in sortedLeaderboard" :key="player.id" :class="{ 'bg-background': player.isCurrentUser }">
            <td class="text-left">
              <v-chip v-if="index === 0" color="yellow-darken-3" variant="flat">
                <v-icon start icon="mdi-crown"></v-icon> 1er
              </v-chip>
              <v-chip v-else-if="index === 1" color="grey-lighten-1" variant="flat">
                <v-icon start icon="mdi-trophy-variant"></v-icon> 2ème
              </v-chip>
              <v-chip v-else-if="index === 2" color="#5d321b" variant="flat">
                <v-icon start icon="mdi-medal"></v-icon> 3ème
              </v-chip>
              <span v-else class="font-weight-bold ml-2">#{{ index + 1 }}</span>
            </td>
            <td class="font-weight-bold text-left">
              <div class="d-flex flex-row align-center justify-space-between">
                <div>{{ player.name }}</div>
                <v-btn icon="mdi-badge-account" size="small" variant="text" @click="goToPlayerProfile(player.id)" title="Voir le profil"></v-btn>
              </div>
            </td>
            <td class="text-left">
              <div class="d-flex align-center">
                <span class="d-inline-block" style="width: 40px">{{ player.cards.common }}</span>
                <v-chip v-if="player.multipliers.common > 1" size="small" color="green">x{{ player.multipliers.common
                }}</v-chip>
              </div>
            </td>
            <td class="text-left">
              <div class="d-flex align-center">
                <span class="d-inline-block" style="width: 40px">{{ player.cards.silver }}</span>
                <v-chip v-if="player.multipliers.silver > 1" size="small" color="green">x{{ player.multipliers.silver
                }}</v-chip>
              </div>
            </td>
            <td class="text-left">
              <div class="d-flex align-center">
                <span class="d-inline-block" style="width: 40px">{{ player.cards.gold }}</span>
                <v-chip v-if="player.multipliers.gold > 1" size="small" color="green">x{{ player.multipliers.gold
                }}</v-chip>
              </div>
            </td>
            <td class="text-left">
              <div class="d-flex align-center">
                <span class="d-inline-block" style="width: 40px">{{ player.cards.foil }}</span>
                <v-chip v-if="player.multipliers.foil > 1" size="small" color="green">x{{ player.multipliers.foil
                }}</v-chip>
              </div>
            </td>
            <td class="text-left">{{ player.achievementPoints.toLocaleString() }} pts</td>
            <td class="text-left font-weight-bold text-primary">{{ player.score.toLocaleString() }} pts</td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import { useDataStore } from '@/store/data.js'
import Leaderboard from '@/classes/Leaderboard.js'
import Settings from '@/classes/Settings.js'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      dataStore: useDataStore(),
      players: [], 
      updatedAt: 0
    }
  },
  computed: {
    settings() {
      return this.dataStore.settings || new Settings()
    },
    pointsConfig() {
      return {
        common: this.settings.rarityPoints.common,
        silver: this.settings.rarityPoints.silver,
        gold: this.settings.rarityPoints.golden,
        foil: this.settings.rarityPoints.foil
      };
    },
    sortedLeaderboard() {
      // Data is already sorted by the Leaderboard class
      return this.players.map(p => ({
          ...p,
          isCurrentUser: this.userStore.profile && p.id === this.userStore.profile.id
      }));
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    async initialize() {
      const lb = await Leaderboard.getOrUpdate();
      this.players = lb.players;
      this.updatedAt = lb.updatedAt;
    },
    goToPlayerProfile(playerId) {
      this.$router.push('/statistics/'+playerId);
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
