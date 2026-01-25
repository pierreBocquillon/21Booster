<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">

      <v-tabs v-model="tab" color="primary" align-tabs="center">
        <v-tab value="collections">Collections</v-tab>
        <v-tab value="cards">Cartes</v-tab>
        <v-tab value="boosters">Boosters</v-tab>
        <v-tab value="codes">Codes</v-tab>
        <v-tab value="salesmen">Vendeurs</v-tab>
        <v-tab value="settings">Paramètres</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="collections" class="pa-5">
          <CollectionsTab />
        </v-window-item>
        <v-window-item value="cards" class="pa-5">
          <CardsTab />
        </v-window-item>
        <v-window-item value="boosters" class="pa-5">
          <BoostersTab />
        </v-window-item>
        <v-window-item value="codes" class="pa-5">
          <CodesTab />
        </v-window-item>
        <v-window-item value="salesmen" class="pa-5">
          <SalesmenTab />
        </v-window-item>
        <v-window-item value="settings" class="pa-5">
          <SettingsTab />
        </v-window-item>
      </v-window>

    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import CollectionsTab from '@/components/config/Collections.vue'
import BoostersTab from '@/components/config/Boosters.vue'
import CardsTab from '@/components/config/Cards.vue'
import CodesTab from '@/components/config/Codes.vue'
import SalesmenTab from '@/components/config/Salesmen.vue'
import SettingsTab from '@/components/config/Settings.vue'

export default {
  props: [],
  components: {
    CollectionsTab,
    BoostersTab,
    CardsTab,
    CodesTab,
    SalesmenTab,
    SettingsTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      tab: 'collections'
    }
  },
}
</script>
