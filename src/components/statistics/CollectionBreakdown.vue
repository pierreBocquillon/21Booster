<template>
  <div>
    <h2 class="text-h5 mb-4">Détail par Collection</h2>
    <v-row>
      <v-col v-for="collection in collections" :key="collection.id" cols="12" md="6">
        <v-card class="pa-4 mb-4" elevation="3">
          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-h6">{{ collection.name }}</h3>
            <div>
              <v-chip color="primary" variant="flat">{{ collection.stats.partial }}%</v-chip>
              &nbsp;
              <v-chip color="error" variant="flat">{{ collection.stats.total }}%</v-chip>
            </div>
          </div>

          <!-- Partial Collection Progress -->
          <div class="mb-4">
            <div class="text-caption mb-1">
              Collection Partielle (Toutes les cartes)
            </div>
            <v-progress-linear :model-value="collection.stats.partial" color="primary" height="10" rounded></v-progress-linear>
          </div>

          <!-- Global Collection Progress -->
          <div class="mb-4">
            <div class="text-caption mb-1">
              Collection Complète (toutes les cartes dans toutes les variantes)
            </div>
            <v-progress-linear :model-value="collection.stats.total" color="error" height="10" rounded></v-progress-linear>
          </div>

          <v-divider class="mb-4"></v-divider>

          <!-- Rarities -->
          <div class="d-flex flex-column gap-2">
            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-circle-small" color="grey"></v-icon>
              <div class="text-caption w-100 ml-2">
                <div class="d-flex justify-space-between">
                  <span>Common</span>
                  <span>{{ collection.stats.common }}%</span>
                </div>
                <v-progress-linear :model-value="collection.stats.common" color="accent" height="6" rounded></v-progress-linear>
              </div>
            </div>

            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-star-four-points-outline" color="blue-grey-darken-1"></v-icon>
              <div class="text-caption w-100 ml-2">
                <div class="d-flex justify-space-between">
                  <span>Silver</span>
                  <span>{{ collection.stats.silver }}%</span>
                </div>
                <v-progress-linear :model-value="collection.stats.silver" color="blue-grey-darken-1" height="6" rounded></v-progress-linear>
              </div>
            </div>

            <div class="d-flex align-center mb-2">
              <v-icon icon="mdi-star-four-points" color="amber"></v-icon>
              <div class="text-caption w-100 ml-2">
                <div class="d-flex justify-space-between">
                  <span>Golden</span>
                  <span>{{ collection.stats.golden }}%</span>
                </div>
                <v-progress-linear :model-value="collection.stats.golden" color="amber" height="6" rounded></v-progress-linear>
              </div>
            </div>

            <div class="d-flex align-center">
              <v-icon icon="mdi-diamond-stone" color="purple-accent-1"></v-icon>
              <div class="text-caption w-100 ml-2">
                <div class="d-flex justify-space-between">
                  <span>Foil</span>
                  <span>{{ collection.stats.foil }}%</span>
                </div>
                <v-progress-linear :model-value="collection.stats.foil" color="purple-accent-1" height="6" rounded></v-progress-linear>
              </div>
            </div>
          </div>

        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'CollectionBreakdown',
  props: {
    collections: {
      type: Array,
      required: true,
      default: () => []
    }
  }
}
</script>
