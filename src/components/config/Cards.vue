<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="pa-5 rounded-xl h-100 d-flex flex-column">
      <div class="d-flex justify-space-between align-center mb-5 shrink">
        <h1 class="text-primary">Cartes</h1>
        <div class="d-flex gap-4 align-center flex-grow-1 mx-10">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" variant="outlined" density="compact" hide-details class="rounded-lg pr-3"></v-text-field>
          <v-select v-model="filterCollection" :items="[{id: null, name: 'Toutes les collections'}, ...collections]" item-title="name" item-value="id" label="Filtrer par collection" variant="outlined" density="compact" hide-details class="rounded-lg" style="max-width: 300px;"></v-select>
        </div>
        <v-btn color="primary" @click="openDialog">
          <v-icon start>mdi-plus</v-icon>
          Ajouter une carte
        </v-btn>
      </div>

      <div class="flex-grow-1 overflow-hidden" style="height: 100%;">
        <v-data-table :headers="headers" :items="filteredCards" :search="search" class="h-100" fixed-header hover items-per-page="-1" hide-default-footer>
          <template v-slot:item.image="{ item }">
            <v-img v-if="item.image" :src="'/cards/' + item.image" width="40" height="60" contain></v-img>
            <v-icon v-else>mdi-image-off</v-icon>
          </template>

          <template v-slot:item.collection="{ item }">
            {{ getCollectionName(item.collection) }}
          </template>

          <template v-slot:item.type="{ item }">
            <v-chip :color="getTypeColor(item.type)" size="small" label>
              {{ getTypeName(item.type) }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-2 justify-end">
              <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="editItem(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteItem(item)"></v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- Dialog Edition -->
    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ formTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" md="4" class="d-flex flex-column align-center">
                <v-card flat border class="d-flex justify-center align-center mb-2" width="160" height="220">
                  <v-img v-if="editedItem.image" :src="'/cards/' + editedItem.image" max-width="100%" max-height="100%" contain></v-img>
                  <v-icon v-else size="60" color="grey-lighten-1">mdi-image</v-icon>
                </v-card>
                <v-btn prepend-icon="mdi-image-search" variant="tonal" color="primary" @click="openImageSelector">
                  Choisir l'image
                </v-btn>
                <div v-if="!editedItem.image" class="text-caption text-error mt-1">Image requise</div>
              </v-col>

              <v-col cols="12" md="8">
                <v-row>
                  <v-col cols="12">
                    <v-text-field v-model="editedItem.number" label="Numéro de la carte" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-text-field v-model="editedItem.name" label="Nom de la carte" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-select v-model="editedItem.collection" :items="collections" item-title="name" item-value="id" label="Collection associée" variant="outlined" density="comfortable" hint="Sélectionnez la collection liée à cette carte" persistent-hint></v-select>
                  </v-col>

                  <v-col cols="12">
                    <v-select v-model="editedItem.type" :items="types" item-title="title" item-value="value" label="Rareté (Type)" variant="outlined" density="comfortable"></v-select>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="close">
            Annuler
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="save">
            Sauvegarder
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Selection Image -->
    <v-dialog v-model="imageDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title class="bg-primary text-white">
          Choisir une image de carte
        </v-card-title>
        <v-card-text class="pa-4" style="height: 500px;">
          <v-item-group v-model="selectedTempImage">
            <v-row dense>
              <v-col v-for="img in availableCardImages" :key="img.value" cols="6" sm="4" md="3">
                <v-item :value="img.value" v-slot="{ isSelected, toggle }">
                  <v-card :color="isSelected ? 'primary' : ''" class="d-flex align-center justify-center pa-2 position-relative" @click="toggle" border flat height="180">
                    <v-img :src="'/cards/' + img.value" contain max-height="140"></v-img>
                    <div v-if="isSelected" class="position-absolute top-0 right-0 ma-2">
                      <v-icon color="white" icon="mdi-check-circle" size="large"></v-icon>
                    </div>
                    <div class="position-absolute bottom-0 w-100 text-center text-caption text-truncate px-1">
                      {{ img.title }}
                    </div>
                  </v-card>
                </v-item>
              </v-col>
            </v-row>
          </v-item-group>
          <div v-if="availableCardImages.length === 0" class="text-center mt-10 text-grey">
            <v-icon size="64" class="mb-2">mdi-image-off</v-icon>
            <p>Aucune image disponible.</p>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="imageDialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="elevated" @click="confirmImageSelection">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Card from '@/classes/Card.js'
import Collection from '@/classes/Collection.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import { useDataStore } from '@/store/data.js'
import logsManager from '@/assets/functions/logsManager.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      dataStore: useDataStore(),
      unsub: [],
      files: {
        cards: []
      },
      search: '',
      filterCollection: null,
      dialog: false,
      imageDialog: false,
      selectedTempImage: null,
      types: [
        { title: 'Commun', value: 'common', color: 'grey-darken-1' },
        { title: 'Inhabituel', value: 'uncommon', color: 'green-darken-1' },
        { title: 'Rare', value: 'rare', color: 'blue-darken-1' },
        { title: 'Mythique', value: 'mythic', color: 'purple-darken-1' },
      ],
      headers: [
        { title: 'Numéro', key: 'number', width: '80px', sortable: true },
        { title: 'Aperçu', key: 'image', width: '80px', sortable: false },
        { title: 'Nom', key: 'name' },
        { title: 'Rareté', key: 'type' },
        { title: 'Collection', key: 'collection' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ],
      editedItem: {},
      defaultItem: {
        id: null,
        number: '',
        name: '',
        image: '',
        collection: '',
        type: 'common',
      },
    }
  },
  computed: {
    cards() {
      const sorted = [...this.dataStore.cards];
      sorted.sort((a, b) => {
        const colA = this.collections.find(c => c.id === a.collection);
        const colB = this.collections.find(c => c.id === b.collection);
        const numA = colA ? (colA.number || 0) : 0;
        const numB = colB ? (colB.number || 0) : 0;

        if (numA !== numB) return numA - numB;
        if (a.collection !== b.collection) return a.collection.localeCompare(b.collection || '');
        // Sort by card number
        const cardNumA = parseInt(a.number) || 0;
        const cardNumB = parseInt(b.number) || 0;
        if (cardNumA !== cardNumB) return cardNumA - cardNumB;
        
        return (a.name || '').localeCompare(b.name || '');
      });
      return sorted;
    },
    collections() {
      return this.dataStore.collections;
    },
    formTitle() {
      return this.editedItem.id ? 'Modifier la carte' : 'Nouvelle carte'
    },
    filteredCards() {
      if (!this.filterCollection) return this.cards;
      return this.cards.filter(c => c.collection === this.filterCollection);
    },
    availableCardImages() {
      const allImages = this.files.cards;
      if (!allImages) return [];

      const usedImages = this.cards
        .filter(c => c.id !== this.editedItem.id) // Exclude current item being edited
        .map(c => c.image)
        .filter(img => img);

      return allImages
        .filter(img => !usedImages.includes(img) || img === this.editedItem.image)
        .map(img => ({ title: img, value: img }));
    }
  },
  async created() {
    await Promise.all([
      this.dataStore.bindCollections(),
      this.dataStore.bindCards()
    ]);
    this.loadFiles()
  },
  methods: {
    // sortCards removed
    async loadFiles() {
      try {
        const response = await fetch('/files.json');
        const data = await response.json();
        this.files = data;
      } catch (e) {
        console.error("Failed to load files list", e);
      }
    },
    getCollectionName(collectionId) {
      const c = this.collections.find(i => i.id === collectionId);
      return c ? c.name : 'Inconnue (' + collectionId + ')';
    },
    getTypeName(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.title : typeValue;
    },
    getTypeColor(typeValue) {
      const t = this.types.find(i => i.value === typeValue);
      return t ? t.color : 'grey';
    },
    openDialog() {
      this.editedItem = { ...this.defaultItem };
      // Default to first collection if available and none selected
      if (this.collections.length > 0 && !this.editedItem.collection) {
        this.editedItem.collection = this.collections[0].id;
      }
      this.dialog = true;
    },
    editItem(item) {
      this.editedItem = {
        id: item.id,
        number: item.number,
        name: item.name,
        image: item.image,
        collection: item.collection,
        type: item.type
      };
      this.dialog = true
    },
    openImageSelector() {
      this.selectedTempImage = this.editedItem.image;
      this.imageDialog = true;
    },
    confirmImageSelection() {
      this.editedItem.image = this.selectedTempImage;
      this.imageDialog = false;
    },
    async deleteItem(item) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer la carte "${item.name}" ? Elle sera retirée de TOUS les profils joueurs.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Suppression...',
            text: 'Nettoyage des profils en cours',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading()
            }
          });
          try {
            await item.delete();
            logsManager.log(this.userStore.profile.name, 'CONFIG', `Suppression de la carte: ${item.name} (${item.id})`);
            Swal.fire(
              'Supprimé !',
              'La carte a été supprimée et retirée de tous les profils.',
              'success'
            )
          } catch (e) {
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: "Erreur lors de la suppression: " + e.message,
            });
          }
        }
      });
    },

    close() {
      this.dialog = false
    },

    async save() {
      if (!this.editedItem.name || !this.editedItem.collection || !this.editedItem.image) {
        Swal.fire({
          icon: 'warning',
          title: 'Attention',
          text: "Veuillez remplir tous les champs obligatoires (Nom, Collection, Image)",
        });
        return;
      }

      try {
        let card;
        if (this.editedItem.id) {
          card = new Card(
            this.editedItem.id,
            this.editedItem.number,
            this.editedItem.name,
            this.editedItem.image,
            this.editedItem.collection,
            this.editedItem.type
          );
        } else {
          card = Card.initOne(this.editedItem.name);
          card.number = this.editedItem.number || "";
          card.image = this.editedItem.image || "";
          card.collection = this.editedItem.collection || "";
          card.type = this.editedItem.type || "common";
        }
        await card.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `${this.editedItem.id ? 'Modification' : 'Création'} de la carte: ${card.name} (${card.id})`);
        this.close();

      } catch (e) {
        console.error("Error saving card:", e);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Erreur lors de l'enregistrement: " + e.message,
        });
      }
    },
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    })
  },
}
</script>
