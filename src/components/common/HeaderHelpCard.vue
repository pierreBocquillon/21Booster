<template>
  <v-card class="rounded-xl pa-4">
    <v-card-title class="text-h5 text-primary text-center">
      21 Booster c'est quoi ?
    </v-card-title>
    <v-card-text>
      <div class="mb-4">
        <h3 class="text-primary my-2">L'expérience ultime de collection de cartes numériques.</h3>
        <p>Entrez dans l'univers de 21 Booster, la plateforme où la passion de la collection rencontre la stratégie. Ouvrez des paquets, gérez votre album et gravissez les échelons pour prouver au monde que vous êtes le collectionneur n°1.</p>
      </div>
      <v-divider></v-divider>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">💎 1. L'Économie : Les Card Coins</h3>
        <p class="my-2">Les Card Coins sont le cœur de votre aventure. Ces jetons précieux constituent la monnaie unique de la plateforme.</p>
        <ul class="ml-4">
          <li><strong>Utilité :</strong> Ils sont indispensables pour acquérir de nouveaux boosters dans la boutique.</li>
          <li><strong>Obtention :</strong> Gagnez-en via le casino, le sacrifice de cartes, les codes promos, ou en rechargeant votre solde auprès de l'un de nos vendeurs.</li>
        </ul>
      </div>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">📦 2. Les Boosters : Le Frisson de l'Ouverture</h3>
        <p class="my-2">Rendez-vous dans la boutique pour échanger vos Coins contre des Boosters.</p>
        <ul class="ml-4">
          <li><strong>Découverte :</strong> Chaque ouverture est une surprise. Découvrez les cartes que vous avez obtenues.</li>
          <li><strong>Rareté :</strong> Croisez les doigts ! Certaines cartes sont communes, d'autres sont extrêmement rares. La chance sera-t-elle de votre côté ?</li>
        </ul>
        <v-expansion-panels class="my-2">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <strong>Voir les taux d'apparition :</strong>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table>
                <tbody>
                  <tr>
                    <th class="font-weight-bold">Rareté\Variante</th>
                    <th class="font-weight-bold">Classique</th>
                    <th class="font-weight-bold">Silver</th>
                    <th class="font-weight-bold">Golden</th>
                    <th class="font-weight-bold">Foil</th>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Commune</th>
                    <td>{{ Math.round((settings.rarityDropRates.common / 100) * (settings.typeDropRates.common / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.silver / 100) * (settings.typeDropRates.common / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.golden / 100) * (settings.typeDropRates.common / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.foil / 100) * (settings.typeDropRates.common / 100) * 10000) / 100 }}%</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Inhabituelle</th>
                    <td>{{ Math.round((settings.rarityDropRates.common / 100) * (settings.typeDropRates.uncommon / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.silver / 100) * (settings.typeDropRates.uncommon / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.golden / 100) * (settings.typeDropRates.uncommon / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.foil / 100) * (settings.typeDropRates.uncommon / 100) * 10000) / 100 }}%</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Rare</th>
                    <td>{{ Math.round((settings.rarityDropRates.common / 100) * (settings.typeDropRates.rare / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.silver / 100) * (settings.typeDropRates.rare / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.golden / 100) * (settings.typeDropRates.rare / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.foil / 100) * (settings.typeDropRates.rare / 100) * 10000) / 100 }}%</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Mythique</th>
                    <td>{{ Math.round((settings.rarityDropRates.common / 100) * (settings.typeDropRates.mythic / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.silver / 100) * (settings.typeDropRates.mythic / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.golden / 100) * (settings.typeDropRates.mythic / 100) * 10000) / 100 }}%</td>
                    <td>{{ Math.round((settings.rarityDropRates.foil / 100) * (settings.typeDropRates.mythic / 100) * 10000) / 100 }}%</td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">🗂️ 3. Gestion des collections, Forge et Cimetière</h3>
        <p class="my-2">L'onglet Collections est votre quartier général. C'est ici que vous admirez votre butin, mais c'est aussi un atelier stratégique pour gérer vos doublons.</p>
        <ul class="ml-4">
          <li><strong>Le Cimetière (Recyclage) :</strong> Vos cartes en double ne sont jamais perdues. "Sacrifiez-les" pour récupérer des Card Coins et acheter de nouveaux boosters.</li>
          <li><strong>La Forge (Fusion) :</strong> Ciblez l'excellence ! Combinez plusieurs exemplaires d'une même carte pour en forger une variante de qualité supérieure.</li>
        </ul>
        <v-expansion-panels class="my-2">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <strong>Voir les valeurs de sacrifice :</strong>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-table>
                <tbody>
                  <tr>
                    <th class="font-weight-bold">Rareté\Variante</th>
                    <th class="font-weight-bold">Classique</th>
                    <th class="font-weight-bold">Silver</th>
                    <th class="font-weight-bold">Golden</th>
                    <th class="font-weight-bold">Foil</th>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Commune</th>
                    <td>{{ settings.rarityCash.common.common }}</td>
                    <td>{{ settings.rarityCash.common.silver }}</td>
                    <td>{{ settings.rarityCash.common.golden }}</td>
                    <td>{{ settings.rarityCash.common.foil }}</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Inhabituelle</th>
                    <td>{{ settings.rarityCash.uncommon.common }}</td>
                    <td>{{ settings.rarityCash.uncommon.silver }}</td>
                    <td>{{ settings.rarityCash.uncommon.golden }}</td>
                    <td>{{ settings.rarityCash.uncommon.foil }}</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Rare</th>
                    <td>{{ settings.rarityCash.rare.common }}</td>
                    <td>{{ settings.rarityCash.rare.silver }}</td>
                    <td>{{ settings.rarityCash.rare.golden }}</td>
                    <td>{{ settings.rarityCash.rare.foil }}</td>
                  </tr>
                  <tr>
                    <th class="font-weight-bold">Mythique</th>
                    <td>{{ settings.rarityCash.mythic.common }}</td>
                    <td>{{ settings.rarityCash.mythic.silver }}</td>
                    <td>{{ settings.rarityCash.mythic.golden }}</td>
                    <td>{{ settings.rarityCash.mythic.foil }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-expansion-panels class="my-2">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <strong>Voir les ratios de conversion de la forge :</strong>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="pl-10">
                <ul>
                  <li>
                    <strong>Ratios de conversion d'une upgrade : </strong>
                    {{ settings.upgradeCost }} pour 1
                  </li>
                  <li>
                    <strong>Ratios de conversion d'une downgrade : </strong>
                    {{ settings.downgradeCost }} pour 1
                  </li>
                </ul>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">🎰 4. Casino</h3>
        <p class="my-2">Vous avez quelques Card Coins qui traînent dans votre inventaire ou vous vous sentez particulièrement chanceux aujourd'hui ? C'est le moment de passer à l'action !</p>
        <p class="my-2">Rien de plus simple : une fois par jour pour seulement 50 Card Coins, vous pouvez lancer la roue et découvrir immédiatement la récompense qui vous attend.</p>
      </div>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">🎁 5. Espace Codes</h3>
        <p class="my-2">Vous avez déniché un code secret ou reçu un cadeau ?</p>
        <p class="my-2">Entrez-le dans la section dédiée pour débloquer des récompenses immédiates : Boosters gratuits, cartes exclusives, nouvelles collections ou stocks de Card Coins. Restez à l'affût !</p>
      </div>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2">🏆 6. Compétition et Progression</h3>
        <p class="my-2">21 Booster n'est pas qu'une collection, c'est une compétition.</p>
        <ul class="ml-4">
          <li><strong>Les Succès :</strong> Relevez des défis spécifiques pour débloquer des bonus et afficher vos prouesses sur votre profil.</li>
          <li><strong>Vos Statistiques :</strong> Accédez à des données détaillées sur votre parcours. Partagez-les pour impressionner vos amis.</li>
          <li><strong>Le Classement :</strong> Comparez-vous à l'élite. Vous gagnez des points en : Collectionnant de nouvelles cartes, complétant des collections entières, validant des succès. </li>
        </ul>
        <p class="my-2">Objectif : Atteindre le sommet et devenir la Légende de 21 Booster.</p>
      </div>
      <v-divider></v-divider>
      <div class="my-4 mt-6">
        <h3 class="text-primary my-2 text-center">🛒 Besoin de plus de Coins ?</h3>
        <p class="my-2">Si vous êtes à court de ressources pour continuer votre collection, cliquez simplement sur votre solde de Card Coins. Afin de vous mettre en relation avec l'un de nos vendeurs.</p>
      </div>
    </v-card-text>
    <v-card-actions class="justify-center">
      <v-btn color="primary" variant="text" @click="$emit('close')">J'ai compris</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  props: {
    settings: {
      type: Object,
      required: true
    }
  },
  emits: ['close']
}
</script>