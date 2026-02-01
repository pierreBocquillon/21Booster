<template>
  <div class="h-100 pa-4">
    <v-card class="h-100 rounded-xl pa-4" style="overflow-y: auto;">
      <h1 class="text-center text-primary mb-8">Codes Promo</h1>

      <!-- Code Entry Section -->
      <v-card class="mb-8 pa-6 elevation-0 mx-auto" max-width="800">
        <v-row align="center">
          <v-col cols="12" md="8">
            <v-text-field v-model="inputCode" label="Entrez votre code promotionnel" placeholder="Ex: WELCOME2026" variant="outlined" hide-details prepend-inner-icon="mdi-ticket-confirmation" @keyup.enter="validateCode"></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-btn color="primary" block size="large" height="56" @click="validateCode" :loading="loading">
              Valider
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- History Section -->
      <v-card class="elevation-5 mx-auto" max-width="1200">
        <v-card-title class="text-h6 font-weight-bold pa-4 bg-background">
          <v-icon start>mdi-history</v-icon>
          Historique des codes activés
        </v-card-title>

        <v-table hover>
          <thead>
            <tr>
              <th class="text-left font-weight-bold">Date et Heure</th>
              <th class="text-left font-weight-bold">Code</th>
              <th class="text-left font-weight-bold">Contenu</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in history" :key="index">
              <td>{{ item.date }}</td>
              <td>
                <v-chip color="primary" size="small" label font-weight-bold>
                  {{ item.code }}
                </v-chip>
              </td>
              <td>{{ item.content }}</td>
            </tr>
            <tr v-if="history.length === 0">
              <td colspan="3" class="text-center pa-4 text-medium-emphasis">
                Aucun code activé pour le moment
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import Code from '@/classes/Code.js'
import oldCards from '@/data/oldCards.json'
import logsManager from '@/assets/functions/logsManager.js'
import notifManager from '@/assets/functions/notifManager.js'
import achievementsManager from '@/assets/functions/achievementsManager.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      inputCode: '',
      loading: false,
    }
  },
  computed: {
    history() {
      if (!this.userStore.profile || !this.userStore.profile.codes) return [];

      const list = Object.entries(this.userStore.profile.codes)
        .sort(([, a], [, b]) => new Date(b.date) - new Date(a.date))
        .map(([key, entry]) => {
          const dateObj = new Date(entry.date);
          const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;

          return {
            date: formattedDate,
            code: key.startsWith('old') ? "Code de l'ancien temps" : entry.code,
            content: entry.rewards
          };
        });

      return list;
    }
  },
  methods: {
    async validateCode() {
      if (!this.inputCode.trim()) return

      this.loading = true

      try {
        const rawInput = this.inputCode.trim();

        // --- Special Handling: Old Codes ---
        // Try to find if input (with or without 'old' prefix) matches an old card key
        const cleanInput = rawInput.replace(/^old/i, '').trim();
        const targetOldKey = Object.keys(oldCards).find(k => k.toLowerCase() === cleanInput.toLowerCase());

        if (targetOldKey) {
          // Use a consistent ID for storing in profile
          const persistentCodeId = 'old' + Code.createId(targetOldKey);

          // 1. Check if user already used an old code
          if (this.userStore.profile.codes) {
            const hasUsedOld = Object.keys(this.userStore.profile.codes).some(k => k.startsWith('old'));
            if (hasUsedOld) {
              throw new Error("Les secrets de l'ancien temps ne peuvent être révélés qu'une seule fois.");
            }
          }

          // 2. Extract Rewards
          const entry = oldCards[targetOldKey];
          // Support both legacy array and new object format
          const isLegacy = Array.isArray(entry);
          const cardData = isLegacy ? entry : (entry.cards || {});
          const collectionList = isLegacy ? [] : (entry.collections || []);
          const stats = isLegacy ? {} : (entry.stats || {});

          if (!this.userStore.profile.cards) this.userStore.profile.cards = {};
          let totalCardsCount = 0;

          if (isLegacy) {
            totalCardsCount = cardData.length;
            cardData.forEach(cid => {
              if (!this.userStore.profile.cards[cid]) {
                this.userStore.profile.cards[cid] = { common: 0, silver: 0, golden: 0, foil: 0 };
              }
              this.userStore.profile.cards[cid].common += 1;
            });
          } else {
            for (const [cid, qty] of Object.entries(cardData)) {
              const quantity = parseInt(qty) || 0;
              if (quantity > 0) {
                totalCardsCount += quantity;
                if (!this.userStore.profile.cards[cid]) {
                  this.userStore.profile.cards[cid] = { common: 0, silver: 0, golden: 0, foil: 0 };
                }
                this.userStore.profile.cards[cid].common += quantity;
              }
            }
          }

          // Give Collections
          if (collectionList.length > 0) {
            if (!this.userStore.profile.collections) this.userStore.profile.collections = {};
            collectionList.forEach(col => {
              this.userStore.profile.collections[col] = true;
            });
          }

          // Give Stats
          if (stats.open && stats.open > 0) {
            if (!this.userStore.profile.stats) this.userStore.profile.stats = { public:true, open: 0, destroy: 0, upgrades: 0, downgrades: 0 };
            this.userStore.profile.stats.open = (this.userStore.profile.stats.open || 0) + parseInt(stats.open);
          }

          // Generate Rewards Text
          let rewardsParts = [];
          if (totalCardsCount > 0) rewardsParts.push(`${totalCardsCount} Cartes (Classique)`);
          if (collectionList.length > 0) rewardsParts.push(`${collectionList.length} Collection(s)`);
          if (stats.open && stats.open > 0) rewardsParts.push(`${stats.open} Booster(s) déjà ouvert(s)`);
          const rewardsString = rewardsParts.join(' + ');

          const ownerName = `${entry.firstName} ${entry.lastName}`.trim() || 'Ancien Propriétaire';

          // Mark code as used
          if (!this.userStore.profile.codes) this.userStore.profile.codes = {};
          this.userStore.profile.codes[persistentCodeId] = {
            date: Date.now(),
            code: rawInput,
            description: `Code de l'ancien temps (${ownerName})`,
            rewards: rewardsString
          };

          // Unlock Achievement + voyageur_du_temps
          if (!this.userStore.profile.achievements) this.userStore.profile.achievements = {};
          this.userStore.profile.achievements['voyageur_du_temps'] = true;
          
          notifManager.sendAchievementNotif(this.userStore.profile.id, 'voyageur_du_temps', 'Vous avez obtenues le succès "Voyageur du temps" !');

          await this.userStore.profile.save();

          achievementsManager.checkForAchievements()

          Swal.fire({
            icon: 'success',
            title: 'Voyage Temporel !',
            text: `Vous avez récupéré l'héritage de ${ownerName} : ${rewardsString}`,
            confirmButtonText: 'Incroyable !'
          });

          this.inputCode = '';
          return; // Exit normally
        }

        // --- Standard Code Logic ---
        // 1. Fetch Code
        // Normalize input using createId (lowercase + slug) to make it case-insensitive
        const codeId = Code.createId(rawInput);
        const code = await Code.getById(codeId);

        if (!code) {
          throw new Error("Ce code n'existe pas.");
        }
        if (this.userStore.profile.codes && this.userStore.profile.codes[code.id]) {
          throw new Error("Vous avez déjà utilisé ce code.");
        }

        // Available amount?
        if (code.amount <= 0) {
          throw new Error("Ce code est épuisé.");
        }

        // Expired?
        if (code.end) {
          // Create a date object for the end of the specified day (23:59:59.999)
          const endDate = new Date(code.end);
          endDate.setHours(23, 59, 59, 999);

          if (Date.now() > endDate.getTime()) {
            throw new Error("Ce code a expiré.");
          }
        }

        // 3. Apply Rewards
        let rewardsDesc = [];

        // Cash
        if (code.cash > 0) {
          this.userStore.profile.cash = (this.userStore.profile.cash || 0) + parseInt(code.cash);
          rewardsDesc.push(`${code.cash} Card coin(s)`);

          await notifManager.sendCashNotif(this.userStore.uid, parseInt(code.cash), `Code Promo : ${code.name}`)
        }

        // Collection
        if (code.collections && code.collections.length > 0) {
          if (!this.userStore.profile.collections) this.userStore.profile.collections = {};
          code.collections.forEach(col => {
            this.userStore.profile.collections[col] = true;
          });
          rewardsDesc.push(`${code.collections.length} Collection(s) débloquée(s)`);
        }
        // Backward compatibility
        if (code.collection && (!code.collections || !code.collections.includes(code.collection))) {
          if (!this.userStore.profile.collections) this.userStore.profile.collections = {};
          this.userStore.profile.collections[code.collection] = true;
          rewardsDesc.push(`Collection débloquée`);
        }

        // Booster
        const boostersNotif = {};
        if (code.boosters && code.boosters.length > 0) {
          if (!this.userStore.profile.boosters) this.userStore.profile.boosters = {};
          code.boosters.forEach(b => {
             if (b.amount > 0 && b.id) {
               this.userStore.profile.boosters[b.id] = (this.userStore.profile.boosters[b.id] || 0) + parseInt(b.amount);
               boostersNotif[b.id] = (boostersNotif[b.id] || 0) + parseInt(b.amount);
               rewardsDesc.push(`${b.amount} Booster(s)`);
             }
          });
        }
        // Backward compatibility
        if (code.booster && code.boosterAmount > 0) {
           // Basic check if already added via list to avoid duplicates if data is mixed
           const alreadyAdded = code.boosters && code.boosters.some(b => b.id === code.booster);
           if (!alreadyAdded) {
               if (!this.userStore.profile.boosters) this.userStore.profile.boosters = {};
               const currentBoosters = this.userStore.profile.boosters[code.booster] || 0;
               this.userStore.profile.boosters[code.booster] = currentBoosters + parseInt(code.boosterAmount);
               boostersNotif[code.booster] = (boostersNotif[code.booster] || 0) + parseInt(code.boosterAmount);
               rewardsDesc.push(`${code.boosterAmount} Booster(s)`);
           }
        }
        
        if (Object.keys(boostersNotif).length > 0) {
           await notifManager.sendBoosterNotif(this.userStore.uid, boostersNotif, `Code Promo : ${code.name}`)
        }

        // Card
        const cardsNotif = {};
        if (code.cards && code.cards.length > 0) {
           if (!this.userStore.profile.cards) this.userStore.profile.cards = {};
           code.cards.forEach(c => {
             if (c.amount > 0 && c.id) {
               if (!this.userStore.profile.cards[c.id]) {
                 this.userStore.profile.cards[c.id] = { common: 0, silver: 0, golden: 0, foil: 0 };
               }
               const rarity = c.rarity || 'common';
               this.userStore.profile.cards[c.id][rarity] = (this.userStore.profile.cards[c.id][rarity] || 0) + parseInt(c.amount);
               
               if (!cardsNotif[c.id]) cardsNotif[c.id] = { amount: 0, rarity: rarity }; // Simplified notif for mixed rarities might need separate
               // Note: notifManager might not support multiple rarities for same card easily in one go? 
               // Assuming simplistic "sendCardNotif"
               // We will just accumulate calls or send one per card
               // For now, let's just trigger notif per item to be safe or bulk if structure permits
               // Looking at existing code: cards[code.card] = { amount: ..., rarity: ... }
               // If we have same card multiple times with diff rarity, last key wins in obj.
               
               // Let's send notif immediately for each card reward to be safe with existing manager
               /* Loop logic below handles batched notif if keys are unique */
             }
           });
           
           // Re-loop for notification to handle multiples correctly if needed, or just push to 'cardsNotif'
           // If 'cardsNotif' structure is key -> {amount, rarity}, we can't have same card different rarity.
           // So we should send individual notifs if collision.
           
           for(const c of code.cards) {
             if(c.amount > 0 && c.id) {
               let singleCardNotif = {};
               singleCardNotif[c.id] = { amount: parseInt(c.amount), rarity: c.rarity || 'common' };
               await notifManager.sendCardNotif(this.userStore.uid, singleCardNotif, `Code Promo : ${code.name}`);
               rewardsDesc.push(`${c.amount} Carte(s)`);
             }
           }
        }

        // Backward compatibility
        if (code.card && code.cardAmount > 0) {
           const alreadyAdded = code.cards && code.cards.some(c => c.id === code.card);
           if (!alreadyAdded) {
              if (!this.userStore.profile.cards) this.userStore.profile.cards = {};
              if (!this.userStore.profile.cards[code.card]) {
                this.userStore.profile.cards[code.card] = { common: 0, silver: 0, golden: 0, foil: 0 };
              }
              const rarity = code.cardRarity || 'common';
              this.userStore.profile.cards[code.card][rarity] = (this.userStore.profile.cards[code.card][rarity] || 0) + parseInt(code.cardAmount);
              rewardsDesc.push(`${code.cardAmount} Carte(s) (${rarity})`);
              
              let singleCardNotif = {}
              singleCardNotif[code.card] = { amount: parseInt(code.cardAmount), rarity: rarity }
              await notifManager.sendCardNotif(this.userStore.uid, singleCardNotif, `Code Promo : ${code.name}`)
           }
        }

        const rewardsString = rewardsDesc.join(', ') || code.description || "Récompense mystère";

        // 4. Update Data

        // Decrement global amount
        code.amount--;
        await code.save();

        // Mark as used in profile
        if (!this.userStore.profile.codes) this.userStore.profile.codes = {};

        // Update stats
        if (!this.userStore.profile.stats) this.userStore.profile.stats = {};

        this.userStore.profile.codes[code.id] = {
          date: new Date().getTime(),
          code: code.name,
          description: code.description,
          rewards: rewardsString,
        };

        await this.userStore.profile.save();

        achievementsManager.checkForAchievements()

        logsManager.log(this.userStore.profile.name, 'CODE', `Code activé : ${code.name}. Gains : ${rewardsString}`);

        Swal.fire({
          icon: 'success',
          title: 'Code Validé !',
          text: `Vous avez reçu : ${rewardsString}`,
          confirmButtonText: 'Super !'
        });

        this.inputCode = '';

      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Oups...',
          text: error.message || "Une erreur est survenue."
        });
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
