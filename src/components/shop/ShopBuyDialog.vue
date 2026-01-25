<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="400">
    <v-card v-if="booster" class="rounded-xl pa-4">
      <h2 class="text-center mb-4">{{ booster.name }}</h2>

      <div class="d-flex flex-column align-center">
        <v-img :src="booster.image ? `/boosters/${booster.image}` : ''" width="150" cover class="mb-4 rounded-lg">
          <template v-slot:placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-icon color="grey-lighten-4" size="64">mdi-image-off</v-icon>
            </div>
          </template>
        </v-img>

        <div class="d-flex align-center my-4">
          <v-btn icon="mdi-minus" variant="tonal" density="comfortable" @click="updateQuantity(-1)" :disabled="buyQuantity <= 1"></v-btn>
          <div class="text-h4 mx-6 font-weight-bold" style="min-width: 40px; text-align: center;">{{ buyQuantity }}
          </div>
          <v-btn icon="mdi-plus" variant="tonal" density="comfortable" @click="updateQuantity(1)" :disabled="userCash < booster.price * (buyQuantity + 1)"></v-btn>
        </div>
        <div class="d-flex flex-row align-center justify-center">
          <div class="text-h6">
            Total : <span :class="{ 'text-error': userCash < totalPrice }">{{ totalPrice }}</span>
          </div>
          <img class="ml-3" src="/card-coin.png" height="20" />
        </div>
        <h4 class="font-weight-regular" v-if="freeBoosterCount > 0">
          + {{ freeBoosterCount }} booster gratuit
        </h4>
        <div class="text-caption text-error" v-if="userCash < totalPrice">
          Solde insuffisant ({{ userCash }})
        </div>
      </div>

      <v-card-actions class="mt-4 justify-space-between">
        <v-btn variant="text" color="grey" @click="$emit('update:modelValue', false)">Annuler</v-btn>
        <v-btn color="primary" variant="flat" :disabled="userCash < totalPrice" @click="confirmBuy">
          Confirmer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ShopBuyDialog',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    booster: {
      type: Object,
      default: null
    },
    userCash: {
      type: Number,
      required: true,
      default: 0
    }
  },
  emits: ['update:modelValue', 'confirm'],
  data() {
    return {
      buyQuantity: 1
    }
  },
  computed: {
    freeBoosterCount() {
      return Math.floor(this.buyQuantity / 5)
    },
    totalPrice() {
      if (!this.booster) return 0
      return this.booster.price * this.buyQuantity
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.buyQuantity = 1
      }
    }
  },
  methods: {
    updateQuantity(val) {
      if (this.buyQuantity + val >= 1) {
        this.buyQuantity += val
      }
    },
    confirmBuy() {
      this.$emit('confirm', {
        booster: this.booster,
        quantity: this.buyQuantity,
        free: this.freeBoosterCount
      });
    }
  }
}
</script>
