<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="pa-5 rounded-xl h-100 d-flex flex-column">
      <div class="d-flex justify-space-between align-center mb-5 shrink">
        <h1 class="text-primary">Boosters</h1>
        <div class="d-flex gap-4 align-center flex-grow-1 mx-10">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" variant="outlined" density="compact" hide-details class="rounded-lg pr-3"></v-text-field>
          <v-select v-model="filterCollection" :items="[{id: null, name: 'Toutes les collections'}, ...collections]" item-title="name" item-value="id" label="Filtrer par collection" variant="outlined" density="compact" hide-details class="rounded-lg" style="max-width: 300px;"></v-select>
        </div>
        <v-btn color="primary" @click="openDialog">
          <v-icon start>mdi-plus</v-icon>
          Ajouter un booster
        </v-btn>
      </div>

      <div class="flex-grow-1 overflow-hidden" style="height: 100%;">
        <v-data-table :headers="headers" :items="filteredBoosters" :search="search" class="h-100" fixed-header hover items-per-page="-1" hide-default-footer>

          <template v-slot:item.image="{ item }">
            <v-img v-if="item.image" :src="'/boosters/' + item.image" width="40" height="60" contain></v-img>
            <v-icon v-else>mdi-image-off</v-icon>
          </template>

          <template v-slot:item.collection="{ item }">
            {{ getCollectionName(item.collection) }}
          </template>

          <template v-slot:item.price="{ item }">
            <div class="d-inline-flex align-center">
              {{ item.price }}
              <v-img src="/card-coin.png" height="20" width="20" class="ml-1" contain></v-img>
            </div>
          </template>

          <template v-slot:item.canBuy="{ item }">
            <v-icon :color="item.canBuy ? 'success' : 'error'">
              {{ item.canBuy ? 'mdi-check-circle' : 'mdi-close-circle' }}
            </v-icon>
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
                  <v-img v-if="editedItem.image" :src="'/boosters/' + editedItem.image" max-width="100%" max-height="100%" contain></v-img>
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
                    <v-text-field v-model="editedItem.name" label="Nom du booster" variant="outlined" density="comfortable" hide-details="auto"></v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-select v-model="editedItem.collection" :items="collections" item-title="name" item-value="id" label="Collection associée" variant="outlined" density="comfortable" hint="Sélectionnez la collection liée à ce booster" persistent-hint></v-select>
                  </v-col>

                  <v-col cols="6">
                    <v-text-field v-model.number="editedItem.size" type="number" label="Taille (cartes)" variant="outlined" density="comfortable"></v-text-field>
                  </v-col>

                  <v-col cols="6">
                    <v-text-field v-model.number="editedItem.price" type="number" label="Prix" variant="outlined" density="comfortable">
                      <template v-slot:append-inner>
                        <v-img src="/card-coin.png" height="24" width="24" contain></v-img>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12">
                    <v-switch v-model="editedItem.canBuy" color="success" label="Disponible à l'achat" hide-details></v-switch>
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
          Choisir une image de booster
        </v-card-title>
        <v-card-text class="pa-4" style="height: 500px;">
          <v-item-group v-model="selectedTempImage">
            <v-row dense>
              <v-col v-for="img in availableBoosterImages" :key="img.value" cols="6" sm="4" md="3">
                <v-item :value="img.value" v-slot="{ isSelected, toggle }">
                  <v-card :color="isSelected ? 'primary' : ''" class="d-flex align-center justify-center pa-2 position-relative" @click="toggle" border flat height="180">
                    <v-img :src="'/boosters/' + img.value" contain max-height="140"></v-img>
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
          <div v-if="availableBoosterImages.length === 0" class="text-center mt-10 text-grey">
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
import Booster from '@/classes/Booster.js'
import Collection from '@/classes/Collection.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      unsub: [],
      boosters: [],
      collections: [],
      files: {
        boosters: []
      },
      search: '',
      filterCollection: null,
      dialog: false,
      imageDialog: false,
      selectedTempImage: null,
      headers: [
        { title: 'Aperçu', key: 'image', width: '80px', sortable: false },
        { title: 'Nom', key: 'name' },
        { title: 'Collection', key: 'collection' },
        { title: 'Prix', key: 'price' },
        { title: 'Disponible', key: 'canBuy', align: 'center' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ],
      editedItem: {},
      defaultItem: {
        id: null,
        name: '',
        image: '',
        size: 5,
        collection: '',
        price: 100,
        canBuy: false,
      },
    }
  },
  computed: {
    formTitle() {
      return this.editedItem.id ? 'Modifier le booster' : 'Nouveau booster'
    },
    filteredBoosters() {
      if (!this.filterCollection) return this.boosters;
      return this.boosters.filter(b => b.collection === this.filterCollection);
    },
    availableBoosterImages() {
      const allImages = this.files.boosters;
      if (!allImages) return [];

      const usedImages = this.boosters
        .filter(b => b.id !== this.editedItem.id) // Exclude current item being edited
        .map(b => b.image)
        .filter(img => img);

      return allImages
        .filter(img => !usedImages.includes(img) || img === this.editedItem.image)
        .map(img => ({ title: img, value: img }));
    }
  },
  created() {
    this.unsub.push(Booster.listenAll((list) => {
      this.boosters = list
      this.sortBoosters()
    }))
    this.unsub.push(Collection.listenAll((list) => {
      this.collections = list
      this.sortBoosters()
    }))
    this.loadFiles()
  },
  methods: {
    sortBoosters() {
      if (!this.boosters.length) return;
      this.boosters.sort((a, b) => {
        const colA = this.collections.find(c => c.id === a.collection);
        const colB = this.collections.find(c => c.id === b.collection);
        const numColA = colA ? (colA.number || 0) : 0;
        const numColB = colB ? (colB.number || 0) : 0;

        if (numColA !== numColB) return numColA - numColB;
        if (a.collection !== b.collection) return (a.collection || '').localeCompare(b.collection || '');
        if (a.size !== b.size) return (a.size || 0) - (b.size || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
    },
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
        name: item.name,
        image: item.image,
        size: item.size,
        collection: item.collection,
        price: item.price,
        canBuy: item.canBuy
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
        text: `Voulez-vous vraiment supprimer le booster "${item.name}" ? Il sera retiré de TOUS les profils joueurs.`,
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
            logsManager.log(this.userStore.profile.name, 'CONFIG', `Suppression du booster: ${item.name} (${item.id})`);
            Swal.fire(
              'Supprimé !',
              'Le booster a été supprimé et retiré de tous les profils.',
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
        let booster;
        if (this.editedItem.id) {
          booster = new Booster(
            this.editedItem.id,
            this.editedItem.name,
            this.editedItem.image,
            this.editedItem.size,
            this.editedItem.collection,
            this.editedItem.price,
            this.editedItem.canBuy
          );
        } else {
          booster = Booster.initOne(this.editedItem.name);
          booster.image = this.editedItem.image || "";
          booster.size = this.editedItem.size || 5;
          booster.collection = this.editedItem.collection || "";
          booster.price = this.editedItem.price || 100;
          booster.canBuy = this.editedItem.canBuy || false;
        }
        await booster.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `${this.editedItem.id ? 'Modification' : 'Création'} du booster: ${booster.name} (${booster.id})`);
        this.close();

      } catch (e) {
        console.error("Error saving booster:", e);
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
