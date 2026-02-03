<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" class="align-center justify-center" fullscreen scrim="rgba(0,0,0,0.8)">
    <div v-if="card" class="d-flex flex-column align-center justify-center w-100 h-100" @click="$emit('update:modelValue', false)">

      <div class="d-flex flex-row align-center justify-center w-100">
        <div class="d-flex flex-column align-center justify-center" @click.stop>
          <div class="collection-card elevation-24 mb-4 mx-3 mt-3" :class="currentRarity" :style="{ '--booster-mask': `url('${currentImageUrl}')`, 'width': computeWidth(currentImageUrl) }" @click.stop>
            <img :src="currentImageUrl">
            </img>
          </div>
        </div>

        <!-- Menu de droite -->
        <div class="d-flex flex-column ml-6 gap-3" @click.stop>

          <!-- UPGRADE / DOWNGRADE -->

          <div class="d-flex flex-column bg-surface pa-3 rounded-lg elevation-3 border border-opacity-25 my-2" style="border-color: rgba(255,255,255,0.1);">
            <div class="d-flex align-center justify-center mb-2">
              <v-icon color="grey-lighten-1" size="small" class="mr-1">mdi-anvil</v-icon>
              <span class="text-caption font-weight-bold text-grey-lighten-1">Forge</span>
            </div>

            <div v-for="(r, i) in rarityTypes.slice(0, rarityTypes.length - 1)" :key="i" class="d-flex flex-column align-center pa-2 my-1 border border-opacity-25 rounded-lg">

              <div>
                <span>{{ rarityTypes[i].label }}</span>
                <v-icon size="large" color="primary">mdi-swap-horizontal</v-icon>
                <span>{{ rarityTypes[i + 1].label }}</span>
              </div>

              <div class="d-flex flex-row align-center justify-center">
                <!-- Upgrade Side -->
                <div class="d-flex flex-column align-center mx-1">
                  <v-tooltip location="top" :text="`Upgrade : ${settings.upgradeCost} ${r.label} -> 1 ${rarityTypes[i + 1].label}`">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :color="r.color" variant="text" size="small" :disabled="getCardAmount(r.value) < settings.upgradeCost" @click="processUpgrade(i)">
                        <v-icon>mdi-arrow-up-bold</v-icon>
                        <span class="text-caption font-weight-bold">{{ settings.upgradeCost }}</span>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>

                <!-- Downgrade Side -->
                <div class="d-flex flex-column align-center mx-1">
                  <v-tooltip location="top" :text="`Downgrade : ${settings.downgradeCost} ${rarityTypes[i + 1].label} -> 1 ${r.label}`">
                    <template v-slot:activator="{ props }">
                      <v-btn v-bind="props" :color="rarityTypes[i + 1].color" variant="text" size="small" :disabled="getCardAmount(rarityTypes[i + 1].value) < settings.downgradeCost" @click="processDowngrade(i + 1)">
                        <v-icon>mdi-arrow-down-bold</v-icon>
                        <span class="text-caption font-weight-bold">{{ settings.downgradeCost }}</span>
                      </v-btn>
                    </template>
                  </v-tooltip>
                </div>
              </div>

            </div>
          </div>

          <!-- RECYCLING ZONE -->
          <div class="d-flex flex-column bg-surface pa-3 rounded-lg elevation-3 border border-opacity-25 my-2" style="border-color: rgba(255,255,255,0.1);">
            <div class="d-flex align-center justify-center mb-1">
              <v-icon color="grey-lighten-1" size="small" class="mr-1">mdi-coffin</v-icon>
              <span class="text-caption font-weight-bold text-grey-lighten-1">Cimetière</span>
            </div>

            <div class="d-flex justify-center mb-4">
              Rareté :&nbsp;
              <v-chip :color="getTypeColor(card.type)" size="x-small" label variant="flat" style="z-index: 150">
                {{ getTypeName(card.type) }}
              </v-chip>
            </div>

            <div v-for="r in rarityTypes" :key="r.value" class="d-flex align-center justify-space-between mb-1">
              <span class="text-subtitle-2 mr-2" :style="{ color: r.color }">{{ r.label }}</span>
              <div class="d-flex align-center bg-grey-darken-3 rounded px-1">
                <v-btn icon="mdi-minus" size="small" variant="text" density="compact" :color="r.color" @click="updateSacrifice(r.value, -1)" :disabled="getSacrificeCount(r.value) <= 0"></v-btn>
                <span class="mx-2 text-caption font-weight-bold text-white">{{ getSacrificeCount(r.value) }}</span>
                <v-btn icon="mdi-plus" size="small" variant="text" density="compact" :color="r.color" @click="updateSacrifice(r.value, 1)" :disabled="getSacrificeCount(r.value) >= getCardAmount(r.value)"></v-btn>
              </div>
            </div>

            <v-btn block color="error" variant="tonal" size="small" class="mt-2" :disabled="totalSacrificeValue <= 0" @click="confirmSacrifice">
              <v-icon start size="small">mdi-fire</v-icon>
              Sacrifier (+{{ totalSacrificeValue }}<v-img src="/card-coin.png" height="16" width="16"></v-img>)
            </v-btn>
          </div>

        </div>
      </div>

      <div class="d-flex gap-2 justify-center mt-4 bg-surface rounded-xl pa-2 elevation-4" @click.stop>
        <v-btn class="mx-2" v-for="type in rarityTypes" :key="type.value" :color="currentRarity === type.value ? type.color : 'grey'" :variant="currentRarity === type.value ? 'flat' : 'text'" @click="currentRarity = type.value" :disabled="getCardAmount(type.value) <= 0">
          {{ type.label }} (x{{ getCardAmount(type.value) }})
        </v-btn>
      </div>

    </div>
  </v-dialog>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'
import achievementsManager from '@/assets/functions/achievementsManager.js'
import notifManager from '@/assets/functions/notifManager.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import Settings from '@/classes/Settings.js'
import Card from '@/classes/Card.js'

export default {
  name: 'CardPreview',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    card: {
      type: Object,
      default: null
    },
    rarity: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      userStore: useUserStore(),
      unsub: [],
      internalRarity: null,
      rarityTypes: [
        { label: 'Classique', value: 'common', color: '#B2A278' },
        { label: 'Silver', value: 'silver', color: '#8ca3ad' },
        { label: 'Golden', value: 'golden', color: '#D7AD47' },
        { label: 'Foil', value: 'foil', color: '#A167B2' }
      ],
      settings: new Settings(),
      sacrificeSelection: {
        common: 0,
        silver: 0,
        golden: 0,
        foil: 0
      },
      types: [
        { title: 'Commun', value: 'common', color: 'grey-darken-1' },
        { title: 'Inhabituel', value: 'uncommon', color: 'green-darken-1' },
        { title: 'Rare', value: 'rare', color: 'blue-darken-1' },
        { title: 'Mythique', value: 'mythic', color: 'purple-darken-1' },
      ]
    }
  },
  created() {
    this.unsub.push(Settings.listenById("general", (s) => {
      this.settings = s || new Settings("general");
    }));
  },
  computed: {
    totalSacrificeValue() {
      if (!this.card || !this.settings?.rarityCash) return 0;
      
      const cardType = this.card.type || 'common'; // Rareté de base de la carte
      const cashValues = this.settings.rarityCash[cardType] || {};

      let total = 0;
      for (const [variant, count] of Object.entries(this.sacrificeSelection)) {
        // variant = variante (common, silver, golden, foil)
        const value = cashValues[variant] || 0;
        total += count * value;
      }
      return total;
    },
    currentRarity: {
      get() {
        return this.internalRarity || this.rarity;
      },
      set(val) {
        this.internalRarity = val;
      }
    },
    currentImageUrl() {
      if (!this.card) return '';
      // Use live amount check
      if (this.canShowImage(this.currentRarity)) {
        return Card.buildImageUrl(this.card.image);
      }
      return this.imageUrl;
    },
    // Get live data from store
    liveCardData() {
      if (!this.card || !this.userStore.profile || !this.userStore.profile.cards) return null;
      return this.userStore.profile.cards[this.card.id];
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.internalRarity = this.rarity;        // Reset selection on open
        this.sacrificeSelection = { common: 0, silver: 0, golden: 0, foil: 0 };
      }
    },
    rarity(val) {
      this.internalRarity = val;
    }
  },
  methods: {
    getTypeName(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.title : typeValue;
    },
    getTypeColor(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.color : 'grey';
    },
    getCardAmount(rarity) {
      if (this.liveCardData) {
        return this.liveCardData[rarity] || 0;
      }
      return (this.card && this.card.amount && this.card.amount[rarity]) || 0;
    },
    canShowImage(rarity) {
      return this.getCardAmount(rarity) > 0;
    },
    isLandscape(currentImageUrl) {
      const img = new Image();
      img.src = currentImageUrl;
      return img.width > img.height;
    },
    getImageRatio(currentImageUrl) {
      const img = new Image();
      img.src = currentImageUrl;
      return img.width / img.height;
    },
    computeWidth(currentImageUrl) {
      let optimalSize = window.innerHeight * 0.75;
      let width = 0;
      if(this.isLandscape(currentImageUrl)){
        width = optimalSize;
      } else {
        width = optimalSize * this.getImageRatio(currentImageUrl);
      }
      return width + 'px';
    },
    async processUpgrade(index) {
      if (index < 0 || index >= this.rarityTypes.length - 1) return;
      const currentRarity = this.rarityTypes[index].value;
      const nextRarity = this.rarityTypes[index + 1].value;
      const cost = this.settings.upgradeCost;

      if (this.getCardAmount(currentRarity) < cost) return;

      try {
        this.userStore.profile.cards[this.card.id][currentRarity] -= cost;
        this.userStore.profile.cards[this.card.id][nextRarity] = (this.userStore.profile.cards[this.card.id][nextRarity] || 0) + 1;

        if (!this.userStore.profile.stats) this.userStore.profile.stats = {};
        this.userStore.profile.stats.upgrades = (this.userStore.profile.stats.upgrades || 0) + 1;

        await this.userStore.profile.save();
        achievementsManager.checkForAchievements();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Upgrade réussi !',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Erreur lors de la sauvegarde.', 'error');
      }
    },
    async processDowngrade(rarityIndex) {
      // rarityIndex is the index of the HIGHER rarity being downgraded
      if (rarityIndex <= 0 || rarityIndex >= this.rarityTypes.length) return;

      const currentRarity = this.rarityTypes[rarityIndex].value;
      const prevRarity = this.rarityTypes[rarityIndex - 1].value;
      const cost = this.settings.downgradeCost;

      if (this.getCardAmount(currentRarity) < cost) return;

      try {
        this.userStore.profile.cards[this.card.id][currentRarity] -= cost;
        this.userStore.profile.cards[this.card.id][prevRarity] = (this.userStore.profile.cards[this.card.id][prevRarity] || 0) + 1;

        if (!this.userStore.profile.stats) this.userStore.profile.stats = {};
        this.userStore.profile.stats.downgrades = (this.userStore.profile.stats.downgrades || 0) + 1;

        if (currentRarity === 'foil') {
          const achId = 'c_est_du_gachis'
          if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {}
          if (!this.userStore.profile.achievements[achId]) {
            this.userStore.profile.achievements[achId] = true
            notifManager.sendAchievementNotif(this.userStore.profile.id, achId, 'Vous avez obtenu le succès "C\'est du gâchis" !')
          }
        }

        await this.userStore.profile.save();
        achievementsManager.checkForAchievements();

        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'info',
          title: 'Downgrade effectué',
          showConfirmButton: false,
          timer: 1500
        });

        if (this.getCardAmount(this.currentRarity) <= 0) {
          if (this.currentRarity === currentRarity) {
            this.currentRarity = prevRarity;
          }
        }

      } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Erreur lors de la sauvegarde.', 'error');
      }
    },
    getSacrificeCount(rarity) {
      return this.sacrificeSelection[rarity] || 0;
    },
    updateSacrifice(rarity, change) {
      const current = this.getSacrificeCount(rarity);
      const owned = this.getCardAmount(rarity);
      const newVal = current + change;
      if (newVal >= 0 && newVal <= owned) {
        this.sacrificeSelection[rarity] = newVal;
      }
    },
    async confirmSacrifice() {
      if (this.totalSacrificeValue <= 0) return;

      const result = await Swal.fire({
        title: 'Confirmation',
        text: `Sacrifier ces cartes pour ${this.totalSacrificeValue} ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, tout détruire !',
        cancelButtonText: 'Annuler'
      });

      if (result.isConfirmed) {
        try {
          let logDetails = [];

          // Process each rarity selected
          for (const [rarity, count] of Object.entries(this.sacrificeSelection)) {
            if (count > 0) {
              // Double check we still own them (race condition safety)
              if (this.userStore.profile.cards[this.card.id][rarity] >= count) {
                this.userStore.profile.cards[this.card.id][rarity] -= count;
                logDetails.push(`${count} ${rarity}`);
              }
            }
          }

          if (logDetails.length === 0) return; // Should not happen if UI is correct

          // Update Cash
          this.userStore.profile.cash += this.totalSacrificeValue;

          // Update Stats
          if (!this.userStore.profile.stats) this.userStore.profile.stats = {};
          if (!this.userStore.profile.stats.destroy) this.userStore.profile.stats.destroy = 0;

          // Count total cards destroyed
          const totalCount = Object.values(this.sacrificeSelection).reduce((a, b) => a + b, 0);
          this.userStore.profile.stats.destroy += totalCount;

          logsManager.log(this.userStore.profile.name, 'DESTROY', `Recyclé ${this.card.name}: ${logDetails.join(', ')} pour ${this.totalSacrificeValue} card coin(s).`);

          await this.userStore.profile.save();
          achievementsManager.checkForAchievements();

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `+${this.totalSacrificeValue} Cash`,
            showConfirmButton: false,
            timer: 1500
          });

          // Reset selection
          this.sacrificeSelection = { common: 0, silver: 0, golden: 0, foil: 0 };

        } catch (e) {
          console.error(e);
          Swal.fire('Erreur', 'Erreur lors du sacrifice.', 'error');
        }
      }
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
