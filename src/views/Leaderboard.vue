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
import Profile from '@/classes/Profile.js'
import achievementsData from '@/data/achievements.json'
import Settings from '@/classes/Settings.js'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      dataStore: useDataStore(),
      players: [], // To be populated with real data
    }
  },
  computed: {
    allCards() {
      return this.dataStore.cards
    },
    allCollections() {
      return this.dataStore.collections
    },
    settings() {
      return this.dataStore.settings || new Settings()
    },
    pointsConfig() {
      // Adapter between Settings (golden) and View (gold) if needed, 
      // or just used for display convenience
      return {
        common: this.settings.rarityPoints.common,
        silver: this.settings.rarityPoints.silver,
        gold: this.settings.rarityPoints.golden,
        foil: this.settings.rarityPoints.foil
      };
    },
    sortedLeaderboard() {
      // Calcul du score pour chaque joueur
      const leaderboardWithScores = this.players.map(player => {
        // Multiplier calculation: 1 + (number of collections completed * configuration setting)
        const getMultiplier = (type) => 1 + ((player.completedCollections?.[type] || 0) * this.settings.collectionMultiplier);

        const score = (player.cards.common * this.pointsConfig.common * getMultiplier('common')) +
          (player.cards.silver * this.pointsConfig.silver * getMultiplier('silver')) +
          (player.cards.gold * this.pointsConfig.gold * getMultiplier('gold')) +
          (player.cards.foil * this.pointsConfig.foil * getMultiplier('foil')) +
          player.achievementPoints;

        return {
          ...player,
          score,
          multipliers: {
            common: getMultiplier('common'),
            silver: getMultiplier('silver'),
            gold: getMultiplier('gold'),
            foil: getMultiplier('foil')
          }
        };
      });

      // Tri par score décroissant
      return leaderboardWithScores.sort((a, b) => b.score - a.score);
    }
  },
  created() {
    this.initialize();
  },
  methods: {
    async initialize() {
      // 1. Fetch necessary metadata
      const profiles = await Profile.getAll();

      // 2. Process each profile
      this.players = profiles
        .filter(profile => {
          // If stats object doesn't exist, default to public=true (same as UsersTab logic)
          // If stats.public is explicitly false, exclude from leaderboard
          if (!profile.activated) {
            return false;
          }
          if (profile.stats && profile.stats.public === false) {
            return false;
          }
          return true;
        })
        .map(profile => {
          return this.calculatePlayerStats(profile);
        });
    },
    goToPlayerProfile(playerId) {
      this.$router.push('/statistics/'+playerId);
    },
    calculatePlayerStats(profile) {
      const userCards = profile.cards || {};

      // Count Unique Cards
      const cardCounts = { common: 0, silver: 0, gold: 0, foil: 0 };

      // Calculate Collections Completed
      const completed = { common: 0, silver: 0, gold: 0, foil: 0 };

      // --- 1. Unique Card Counts ---
      Object.entries(userCards).forEach(([cardId, cardData]) => {
        // Find definition to check collection
        const cardDef = this.allCards.find(c => c.id === cardId);
        if (!cardDef) return;

        // SKIP if user does not own the collection
        if (!profile.collections || !profile.collections[cardDef.collection]) return;

        if (cardData.common > 0) cardCounts.common++;
        if (cardData.silver > 0) cardCounts.silver++;
        // Note: Profile normally stores keys as 'common', 'silver', 'golden', 'foil'. 
        // View expects 'gold', but profile data usually has 'golden'. Need to map.
        if ((cardData.golden || cardData.gold) > 0) cardCounts.gold++;
        if (cardData.foil > 0) cardCounts.foil++;
      });

      // --- 2. Collection Completion ---
      this.allCollections.forEach(collection => {
        // SKIP if user does not own the collection
        if (!profile.collections || !profile.collections[collection.id]) return;

        const collectionCardIds = this.allCards
          .filter(c => c.collection === collection.id)
          .map(c => c.id);

        if (collectionCardIds.length === 0) return;

        // Check each rarity for full completion of this collection
        const isComplete = (rarityKey) => {
          return collectionCardIds.every(cardId => {
            const owned = userCards[cardId];
            // Handle 'golden' vs 'gold' if necessary
            const key = rarityKey === 'gold' ? 'golden' : rarityKey;
            return owned && owned[key] > 0;
          });
        };

        if (isComplete('common')) completed.common++;
        if (isComplete('silver')) completed.silver++;
        if (isComplete('gold')) completed.gold++;
        if (isComplete('foil')) completed.foil++;
      });

      // --- 3. Achievement Points ---
      let achievementPoints = 0;
      if (profile.achievements) {
        achievementsData.forEach(ach => {
          if (profile.achievements[ach.id] === true) {
            achievementPoints += ach.points;
          }
        });
      }

      return {
        id: profile.id,
        name: profile.name || 'Joueur Inconnu',
        isCurrentUser: this.userStore.profile && profile.id === this.userStore.profile.id,
        achievementPoints: achievementPoints,
        cards: cardCounts,
        completedCollections: completed
      };
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
