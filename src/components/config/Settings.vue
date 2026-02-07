<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h2>Paramètres Généraux</h2>
      <v-btn color="primary" @click="saveSettings" :loading="loading">Enregistrer</v-btn>
    </div>

    <v-form v-model="valid">
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="pa-4 mb-4" title="Economie & Progression">
            <v-text-field label="Coût Upgrade (nb cartes)" v-model.number="settings.upgradeCost" type="number" hint="Nombre de cartes de rareté inférieure pour en créer une supérieure" persistent-hint></v-text-field>
            <v-text-field label="Coût Downgrade (nb cartes)" v-model.number="settings.downgradeCost" type="number" hint="Nombre de cartes de rareté supérieure pour créer une inférieure" persistent-hint class="mt-4"></v-text-field>
            <v-text-field label="Bonus Journalier" v-model.number="settings.dailyBonus" type="number" hint="Montant gagné chaque jour" persistent-hint class="mt-4">
              <template v-slot:append-inner>
                <v-img src="/card-coin.png" width="20" height="20"></v-img>
              </template>
            </v-text-field>
            <v-text-field label="Bonus Nouveau Compte" v-model.number="settings.welcomeBonus" type="number" hint="Montant offert aux nouveaux joueurs" persistent-hint class="mt-4">
              <template v-slot:append-inner>
                <v-img src="/card-coin.png" width="20" height="20"></v-img>
              </template>
            </v-text-field>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-4 mb-4" title="Classement (Score)">
            <v-text-field label="Multiplicateur par Collection Complète" v-model.number="settings.collectionMultiplier" type="number" step="0.01"></v-text-field>
            <v-text-field label="Classique" v-model.number="settings.rarityPoints.common" type="number" prefix="pts"></v-text-field>
            <v-text-field label="Silver" v-model.number="settings.rarityPoints.silver" type="number" prefix="pts"></v-text-field>
            <v-text-field label="Golden" v-model.number="settings.rarityPoints.golden" type="number" prefix="pts"></v-text-field>
            <v-text-field label="Foil" v-model.number="settings.rarityPoints.foil" type="number" prefix="pts"></v-text-field>
            <v-text-field label="Âme" v-model.number="settings.soulPoints" type="number" prefix="pts"></v-text-field>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-4 mb-4" title="Probabilités par Rareté">
            <v-text-field label="Commune (%)" :model-value="commonTypeProb" readonly suffix="%" variant="outlined" hint="(Calculé automatiquement)" persistent-hint class="mb-4"></v-text-field>
            <v-text-field label="Inhabituelle (%)" v-model.number="settings.typeDropRates.uncommon" type="number" suffix="%"></v-text-field>
            <v-text-field label="Rare (%)" v-model.number="settings.typeDropRates.rare" type="number" suffix="%"></v-text-field>
            <v-text-field label="Mythique (%)" v-model.number="settings.typeDropRates.mythic" type="number" suffix="%"></v-text-field>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-4 mb-4" title="Probabilités par Variantes">
            <v-text-field label="Classique (%)" :model-value="commonRarityProb" readonly suffix="%" variant="outlined" hint="(Calculé automatiquement)" persistent-hint class="mb-4"></v-text-field>
            <v-text-field label="Silver (%)" v-model.number="settings.rarityDropRates.silver" type="number" min="0" max="100" suffix="%"></v-text-field>
            <v-text-field label="Golden (%)" v-model.number="settings.rarityDropRates.golden" type="number" min="0" max="100" suffix="%"></v-text-field>
            <v-text-field label="Foil (%)" v-model.number="settings.rarityDropRates.foil" type="number" min="0" max="100" suffix="%"></v-text-field>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="pa-4 mb-4" title="Valeurs de Recyclage">
            <v-table>
              <thead>
                <tr>
                  <th class="text-left">Rareté \ Variante</th>
                  <th v-for="(vLabel, vKey) in variants" :key="vKey" class="text-center">
                    {{ vLabel }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(label, key) in rarities" :key="key">
                  <td class="font-weight-bold">{{ label }}</td>
                  <td v-for="(vLabel, vKey) in variants" :key="vKey">
                    <v-text-field v-if="settings.rarityCash && settings.rarityCash[key]" hide-details density="compact" v-model.number="settings.rarityCash[key][vKey]" type="number" variant="underlined" class="text-center">
                      <template v-slot:prepend-inner>
                        <v-img src="/card-coin.png" width="16" height="16"></v-img>
                      </template>
                    </v-text-field>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="pa-4 mb-4" title="Valeurs d'extraction">
            <v-table>
              <thead>
                <tr>
                  <th v-for="(label, key) in rarities" :key="key" class="text-center">
                    {{ label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="(label, key) in rarities" :key="key">
                    <v-text-field v-if="settings.raritySoul && settings.raritySoul[key]" hide-details density="compact" v-model.number="settings.raritySoul[key]" type="number" variant="underlined" class="text-center">
                      <template v-slot:prepend-inner>
                        <v-img src="/card-soul.png" width="20" height="20"></v-img>
                      </template>
                    </v-text-field>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>

      </v-row>
    </v-form>
  </v-container>
</template>

<script>
import Settings from '@/classes/Settings.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'

export default {
  name: 'SettingsConfig',
  data() {
    return {
      userStore: useUserStore(),
      unsub: [],
      valid: false,
      loading: false,
      settings: new Settings(),
      rarities: {
        common: 'Commune',
        uncommon: 'Inhabituelle',
        rare: 'Rare',
        mythic: 'Mythique'
      },
      variants: {
        common: 'Classique',
        silver: 'Silver',
        golden: 'Golden',
        foil: 'Foil'
      }
    }
  },
  computed: {
    commonTypeProb() {
      const { uncommon, rare, mythic } = this.settings.typeDropRates || {};
      const val = 100 - ((uncommon || 0) + (rare || 0) + (mythic || 0));
      return Math.max(0, val);
    },
    commonRarityProb() {
      const { silver, golden, foil } = this.settings.rarityDropRates || {};
      const val = 100 - ((silver || 0) + (golden || 0) + (foil || 0));
      return Math.max(0, val);
    }
  },
  created() {
    this.loadSettings();
  },
  methods: {
    loadSettings() {
      this.unsub.push(Settings.listenById("general", (s) => {
        this.settings = s || new Settings("general");
      }));
    },
    async saveSettings() {
      this.loading = true;
      try {
        // Mettre à jour la valeur 'common' calculée avant de sauvegarder
        if (this.settings.typeDropRates) {
          this.settings.typeDropRates.common = this.commonTypeProb;
        }
        if (this.settings.rarityDropRates) {
          this.settings.rarityDropRates.common = this.commonRarityProb;
        }

        await this.settings.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `Mise à jour des paramètres généraux`);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Paramètres sauvegardés',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (e) {
        console.error(e);
        Swal.fire('Erreur', 'Impossible de sauvegarder', 'error');
      } finally {
        this.loading = false;
      }
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    })
  },
}
</script>
