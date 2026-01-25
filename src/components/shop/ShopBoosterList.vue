<template>
  <div class="d-flex flex-row align-center justify-center flex-wrap">
    <div class="mx-12 mb-12 pb-6 d-flex flex-column justify-center align-center" v-for="booster in boosters" :key="booster.id">
      <v-img :src="booster.image ? `/boosters/${booster.image}` : ''" width="250" cover class="align-end">
        <template v-slot:placeholder>
          <div class="d-flex align-center justify-center fill-height">
            <v-icon color="grey-lighten-4" size="64">mdi-image-off</v-icon>
          </div>
        </template>
      </v-img>

      <h1 class="text-h6 font-weight-bold pt-4 text-center" style="width: 300px; height: 80px;">
        {{ booster.name }}
      </h1>

      <v-card-subtitle class="pb-2">
        (1 booster = {{ booster.size }} Cartes)
      </v-card-subtitle>

      <v-card-actions class="d-flex justify-center pb-4">
        <v-btn block color="primary" variant="outlined" size="large" @click="$emit('buy', booster)" :disabled="userCash < booster.price">
          Acheter - {{ booster.price }} <img src="/card-coin.png" height="20" class="ml-2" />
        </v-btn>
      </v-card-actions>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShopBoosterList',
  props: {
    boosters: {
      type: Array,
      required: true,
      default: () => []
    },
    userCash: {
      type: Number,
      required: true,
      default: 0
    }
  },
  emits: ['buy']
}
</script>
