<template>
  <div>
    <div class="d-flex align-center mb-2">
      <h1 class="text-primary">Ouverture du Booster {{ booster.name }}</h1>
    </div>

    <div class="booster-scene" @click="$emit('skip')">
      <!-- Particles & Explosion -->
      <div v-if="status === 'exploded'" class="explosion-container">
        <div class="explosion-flash"></div>
        <div v-for="n in 100" :key="n" class="particle" :style="getParticleStyle(n)"></div>
      </div>

      <!-- Cards Layer (Behind Booster) -->
      <div class="card-group" :class="{ 'revealed': isRevealed }" :style="{ '--card-overlap': cardOverlap }" v-if="currentBoosterCardWidth">
        <div v-for="(item, index) in cards" :key="index" class="card-container cursor-pointer" :style="getCardStyle(item, index)">
          <div style="position: relative;" :class="item.type">
            <v-img :src="`/cards/${item.frontImage}`" :style="{'width': currentBoosterCardWidth + 'px'}" cover :transition="false"></v-img>
          </div>
          <v-img v-if="item.isNew" src="/new.png" width="80" style="position: absolute; top: -20px; z-index: 10;" :style="{'left': Math.round((currentBoosterCardWidth/2)-40) + 'px'}"></v-img>
        </div>
      </div>

      <!-- Booster Layer (On Top) -->
      <div v-if="!isRevealed" id="booster" :class="animationClasses">
        <div class="booster-part booster-top">
          <img :src="`/boosters/${booster.image}`" height="500" />
        </div>
        <div class="booster-part booster-bottom">
          <img :src="`/boosters/${booster.image}`" height="500" />
        </div>
      </div>
    </div>

    <div v-if="isRevealed" class="d-flex flex-row align-center justify-center mt-4">
      <v-btn color="primary" variant="outlined" class="mx-2" @click.stop="$emit('reset')">
        Ouvrir un autre
      </v-btn>
      <v-btn color="primary" variant="outlined" class="mx-2" @click.stop="$emit('reopen')" v-if="boosterIsReopenable">
        Ouvrir le même ({{ userStore.profile.boosters[booster.id] }} restants)
      </v-btn>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

export default {
  name: 'BoosterOpening',
  props: {
    booster: {
      type: Object,
      required: true
    },
    cards: {
      type: Array,
      default: () => []
    },
    status: {
      type: String, // 'idle', 'opening', 'exploded', 'revealed'
      required: true
    }
  },
  emits: ['skip', 'reset', 'reopen'],
  data() {
    return {
      userStore: useUserStore(),
      currentBoosterCardWidth: null
    }
  },
  watch: {
    cards: {
      immediate: true,
      handler() {
        this.calculateCardWidth()
      }
    }
  },
  computed: {
    isRevealed() {
      return this.status === 'revealed';
    },
    animationClasses() {
      return {
        'opening': this.status === 'opening',
        'exploded': this.status === 'exploded'
      };
    },
    cardOverlap() {
      if (!this.booster) return '-80px';
      const size = this.booster.size;
      const overlap = Math.max((this.currentBoosterCardWidth/2) - ((window.innerWidth * 0.8 / size) / 2), 50);
      return `-${overlap}px`;
    },
    boosterIsReopenable() {
      if (!this.userStore.profile || !this.userStore.profile.boosters) return false;
      return (this.userStore.profile.boosters[this.booster.id] || 0) > 0;
    }
  },
  methods: {
    calculateCardWidth() {
      this.currentBoosterCardWidth = null;
      if (!this.cards || this.cards.length === 0) return;

      let image = new Image();
      image.onload = () => {
        let cardWidth = image.width;
        let cardHeight = image.height;

        if (cardHeight > cardWidth) {
          this.currentBoosterCardWidth = (cardWidth / cardHeight) * 500;
        } else {
          this.currentBoosterCardWidth = 360;
        }
      };
      image.src = '/cards/' + this.cards[0].frontImage;
    },
    // Styles for individual cards in fan layout
    getCardStyle(item, index) {
      const boosterSize = this.booster.size;

      const rotation = boosterSize > 1 ? -5 + (index / (boosterSize - 1)) * 10 : 0;
      const translateY = ((150 / (1 - Math.cos(15 * Math.PI / 180))) * (1 - Math.cos(((rotation) * (Math.PI / 180)))));

      const style = {
        '--rotation': rotation + 'deg',
        '--translate-y': translateY + 'px',
        '--i': index,
      };

      // Special Effects Masks
      if (item.type !== 'common') {
        style['--booster-mask'] = `url(/cards/${item.frontImage})`;
        style['--anim-delay'] = `${Math.random() * 0.5}s`;
      }

      return style;
    },
    // Random styles for explosion particles
    getParticleStyle(n) {
      const angle = Math.random() * 360;
      const distance = 200 + Math.random() * 500;
      const size = 3 + Math.random() * 10;
      const duration = 0.8 + Math.random() * 0.6;
      const delay = Math.random() * 0.2;

      const colors = ['#ffffff', '#fff7bd', '#ffd700', '#ffeb3b', '#ff4500']; // White, Gold, and Orange spectrum
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        '--angle': `${angle}deg`,
        '--distance': `${distance}px`,
        '--size': `${size}px`,
        '--duration': `${duration}s`,
        '--delay': `${delay}s`,
        '--color': color
      };
    }
  }
}
</script>
