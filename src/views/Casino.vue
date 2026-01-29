<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" class="text-center">
        <div class="d-flex justify-center mb-10">
          <v-btn size="x-large" color="primary" @click="spin" :disabled="spinning || alreadySpunToday || userStore.profile.cash < 50">
            <span v-if="alreadySpunToday">Vous avez déjà lancé la roue aujourd'hui !</span>
            <span v-else>Lancer la roue (50 <img src="/card-coin.png" height="20" class="ml-1" style="vertical-align: middle;" />)</span>
          </v-btn>
        </div>
      </v-col>

      <v-col cols="12" class="d-flex justify-center align-center position-relative py-5">
        <!-- Pointer -->
        <div class="pointer-arrow"></div>
        <div class="pointer-arrow-shadow"></div>

        <!-- Wheel Container -->
        <div class="wheel-shadow"></div>
        <div class="wheel-wrapper">
          <div class="wheel" :style="wheelStyle">
            <!-- Labels -->
            <div v-for="(item, index) in items" :key="index" class="wheel-label" :style="getLabelStyle(index)">
              <div class="label-text text-shadow font-weight-bold" v-html="item.label"></div>
            </div>
          </div>
        </div>
        <div class="wheel-center">
          <v-img src="/logo-rond.png" height="240"></v-img>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'
import notifManager from '@/assets/functions/notifManager.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import Booster from '@/classes/Booster.js'
import Collection from '@/classes/Collection.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      items: [], // Will be filled with 25 items
      spinning: false,
      wheelRotation: 0,
      boosters: [],
      collections: [],
      unsubBoosters: null,
      unsubCollections: null,
    }
  },
  created() {
    this.generateItems()
    Booster.listenAll((list) => {
      this.boosters = list
    }).then(unsub => {
      this.unsubBoosters = unsub
    })
    Collection.listenAll((list) => {
      this.collections = list
    }).then(unsub => {
      this.unsubCollections = unsub
    })
  },
  beforeUnmount() {
    if (this.unsubBoosters) this.unsubBoosters()
    if (this.unsubCollections) this.unsubCollections()
  },
  computed: {
    wheelStyle() {
      // Build conic gradient
      let gradientParts = []
      let degPerItem = 360 / this.items.length

      this.items.forEach((item, index) => {
        let start = index * degPerItem
        let end = (index + 1) * degPerItem
        gradientParts.push(`${item.hexColor} ${start}deg ${end}deg`)
      })

      return {
        background: `conic-gradient(from 0deg, ${gradientParts.join(', ')})`,
        transform: `rotate(${this.wheelRotation}deg)`,
        transition: this.spinning ? 'transform 5s cubic-bezier(0.1, 0, 0.18, 1)' : 'none'
      }
    },
    alreadySpunToday() {
      if (!this.userStore.profile.lastWheelSpin) return false
      const lastDate = new Date(this.userStore.profile.lastWheelSpin)
      const today = new Date()

      return lastDate.toLocaleDateString() === today.toLocaleDateString()
    }
  },
  methods: {
    getLabelStyle(index) {
      let degPerItem = 360 / this.items.length
      let rotation = (index * degPerItem) + (degPerItem / 2) // Center of segment
      return {
        transform: `rotate(${rotation}deg) translateY(-220px) rotate(-90deg)`
      }
    },
    generateItems() {
      // Rewards configuration
      let rewards = [0, 50, 100, 50, 0, 'b1', 0, 50, 100, 50, 0, 'b3', 0, 50, 100, 50, 0, 'b1', 0, 50, 100, 50, 0, 'b3']

      this.items = rewards.map(val => {
        if (val === 0) return { label: 'PERDU', value: 0, hexColor: '#16110c' }
        if (val === 50) return { label: '50 <img src="/card-coin.png" class="ml-1" height="16" style="vertical-align: middle; margin-bottom: 2px;" />', value: 50, hexColor: '#2d1d0e' }
        if (val === 100) return { label: '100 <img src="/card-coin.png" class="ml-1" height="16" style="vertical-align: middle; margin-bottom: 2px;" />', value: 100, hexColor: '#543113' }
        if (val === 'b1') return { label: '1 BOOSTER', value: 'b1', hexColor: '#9e5617' }
        if (val === 'b3') return { label: '3 BOOSTERS', value: 'b3', hexColor: '#F17511' }
        return { label: '?', value: val, hexColor: '#000000' }
      })
    },
    async spin() {
      if (this.userStore.profile.cash < 50) {
        Swal.fire('Erreur', 'Pas assez d\'argent !', 'error')
        return
      }

      this.spinning = true

      // Pay 50
      this.userStore.profile.cash -= 50
      this.userStore.profile.lastWheelSpin = new Date().getTime()
      await this.userStore.profile.save()

      // Trigger Achievement if not already
      if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};
      if (!this.userStore.profile.achievements['casino']) {
        this.userStore.profile.achievements['casino'] = true;
        notifManager.sendAchievementNotif(this.userStore.profile.id, 'casino', 'Vous avez lancé la roue du casino !');
        await this.userStore.profile.save();
      }

      // Setup spin
      // Minimum 5 full rotations + random angle
      // We want to land randomly.
      const extraSpins = 5 + Math.floor(Math.random() * 3)
      const randomAngle = Math.floor(Math.random() * 360)

      // Calculate new total rotation (accumulative to prevent counter-spin)
      // Ensure we always move forward
      const currentRot = this.wheelRotation % 360
      const spins = 360 * extraSpins

      // Target is what we want to end up at visual state
      // To be safe, just add spins + target
      this.wheelRotation += (spins + randomAngle)

      setTimeout(() => {
        this.endSpin()
      }, 5000) // Match CSS transition duration
    },
    async endSpin() {
      this.spinning = false

      // Calculate winner based on Angle
      // Pointer is at Top (0deg)
      // Item 0 is at 0-14.4deg initially.
      // If we rotate wheel by R deg clockwise.
      // The angle at the pointer relative to wheel start is (360 - R % 360) % 360

      const degPerItem = 360 / this.items.length
      const normalizedRotation = this.wheelRotation % 360
      const pointerAngle = (360 - normalizedRotation) % 360

      // Find which segment contains pointerAngle
      const winningIndex = Math.floor(pointerAngle / degPerItem)
      const wonItem = this.items[winningIndex]

      if (wonItem.value === 'b1' || wonItem.value === 'b3') {
        const publicBoosters = this.boosters.filter(b => {
          if (!b.canBuy) return false
          const collection = this.collections.find(c => c.id === b.collection)
          return collection && collection.isPublic
        })

        if (publicBoosters.length > 0) {
          let count = wonItem.value === 'b3' ? 3 : 1
          const randomBooster = publicBoosters[Math.floor(Math.random() * publicBoosters.length)]

          if (!this.userStore.profile.boosters) this.userStore.profile.boosters = {}

          this.userStore.profile.boosters[randomBooster.id] = (this.userStore.profile.boosters[randomBooster.id] || 0) + count
          await this.userStore.profile.save()
          
          logsManager.log(this.userStore.profile.name, 'CASINO', `A gagné ${count} boosters: ${randomBooster.name}`)
          notifManager.sendBoosterNotif(this.userStore.profile.id, { [randomBooster.id]: count }, 'Gain Casino')

          Swal.fire({
            title: 'Gagné !',
            text: `Vous avez remporté ${count} x ${randomBooster.name} !`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
            background: '#1e1e1e',
            color: '#fff'
          })
        } else {
          Swal.fire('Erreur', 'Aucun booster disponible.', 'error')
        }
      } else if (wonItem.value > 0) {
        this.userStore.profile.cash += wonItem.value
        await this.userStore.profile.save()

        logsManager.log(this.userStore.profile.name, 'CASINO', `A gagné ${wonItem.value} coins`)
        notifManager.sendCashNotif(this.userStore.profile.id, wonItem.value, 'Gain Casino')

      } else {
        Swal.fire({
          title: 'Perdu...',
          icon: 'error',
          timer: 1500,
          showConfirmButton: false,
          background: '#1e1e1e',
          color: '#fff'
        })
      }
    }
  }
}
</script>