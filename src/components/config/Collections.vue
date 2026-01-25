<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="pa-5 rounded-xl h-100 d-flex flex-column">
      <div class="d-flex justify-space-between align-center mb-5 shrink">
        <h1 class="text-primary">Collections</h1>
        <div class="d-flex gap-4 align-center flex-grow-1 mx-10">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" variant="outlined" density="compact" hide-details class="rounded-lg"></v-text-field>
        </div>
        <v-btn color="primary" @click="openDialog">
          <v-icon start>mdi-plus</v-icon>
          Ajouter une collection
        </v-btn>
      </div>

      <div class="flex-grow-1 overflow-hidden" style="height: 100%;">
        <v-data-table :headers="headers" :items="collections" :search="search" class="h-100" fixed-header hover items-per-page="-1" hide-default-footer>
          <template v-slot:item.coverImage="{ item }">
            <v-img v-if="item.coverImage" :src="'/collections_cover/' + item.coverImage" width="50" height="50" cover class="rounded bg-grey-lighten-2"></v-img>
            <v-icon v-else>mdi-image-off</v-icon>
          </template>

          <template v-slot:item.isPublic="{ item }">
            <v-icon :color="item.isPublic ? 'success' : 'error'">
              {{ item.isPublic ? 'mdi-check-circle' : 'mdi-close-circle' }}
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

    <v-dialog v-model="dialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ formTitle }}
        </v-card-title>

        <v-card-text class="pt-4">
          <v-container>
            <v-row>
              <v-col cols="12" md="2">
                <v-text-field v-model.number="editedItem.number" label="N°" type="number"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="editedItem.name" label="Nom de la collection" :disabled="!!editedItem.id"></v-text-field>
              </v-col>
              <v-col cols="12" md="4" class="d-flex align-center">
                <v-switch v-model="editedItem.isPublic" label="Publique" color="primary" hide-details></v-switch>
              </v-col>

              <v-col cols="12"><v-divider></v-divider></v-col>
              <v-col cols="12">
                <h3 class="text-h6 mb-2">Images</h3>
              </v-col>

              <v-col cols="12" md="4">
                <p class="text-subtitle-2 mb-2">Image de couverture</p>
                <div class="d-flex flex-column align-center gap-2">
                  <v-img v-if="editedItem.coverImage" :src="'/collections_cover/' + editedItem.coverImage" height="120" width="100%" cover class="rounded bg-grey-lighten-2 border mb-2"></v-img>
                  <v-sheet v-else height="120" width="100%" class="rounded bg-grey-lighten-4 border d-flex align-center justify-center mb-2">
                    <span class="text-caption text-grey">Aucune image</span>
                  </v-sheet>
                  <v-btn block color="primary" variant="tonal" @click="openImageSelector('coverImage')">
                    <v-icon start>mdi-image</v-icon>
                    Choisir couverture
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <p class="text-subtitle-2 mb-2">Image de page</p>
                <div class="d-flex flex-column align-center gap-2">
                  <v-img v-if="editedItem.pageImage" :src="'/collections_page/' + editedItem.pageImage" height="120" width="100%" cover class="rounded bg-grey-lighten-2 border mb-2"></v-img>
                  <v-sheet v-else height="120" width="100%" class="rounded bg-grey-lighten-4 border d-flex align-center justify-center mb-2">
                    <span class="text-caption text-grey">Aucune image</span>
                  </v-sheet>
                  <v-btn block color="primary" variant="tonal" @click="openImageSelector('pageImage')">
                    <v-icon start>mdi-book-open-page-variant</v-icon>
                    Choisir page
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="4">
                <p class="text-subtitle-2 mb-2">Image de carte</p>
                <div class="d-flex flex-column align-center gap-2">
                  <v-img v-if="editedItem.cardImage" :src="'/collections_card/' + editedItem.cardImage" height="120" width="100%" cover class="rounded bg-grey-lighten-2 border mb-2"></v-img>
                  <v-sheet v-else height="120" width="100%" class="rounded bg-grey-lighten-4 border d-flex align-center justify-center mb-2">
                    <span class="text-caption text-grey">Aucune image</span>
                  </v-sheet>
                  <v-btn block color="primary" variant="tonal" @click="openImageSelector('cardImage')">
                    <v-icon start>mdi-cards</v-icon>
                    Choisir carte
                  </v-btn>
                </div>
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
          Choisir une image : {{ currentImageTypeLabel }}
        </v-card-title>
        <v-card-text class="pa-4" style="height: 500px;">
          <v-item-group v-model="selectedTempImage">
            <v-row dense>
              <v-col v-for="img in currentAvailableImages" :key="img.value" cols="6" sm="4" md="3">
                <v-item :value="img.value" v-slot="{ isSelected, toggle }">
                  <v-card @click="toggle" :color="isSelected ? 'primary' : ''" class="d-flex flex-column cursor-pointer" border height="100%" elevation="0">
                    <v-img :src="getCurrentImagePath(img.value)" height="140" cover class="bg-white">
                      <div v-if="isSelected" class="d-flex w-100 h-100 align-center justify-center" style="background: rgba(var(--v-theme-primary), 0.5)">
                        <v-icon color="white" size="48">mdi-check-circle</v-icon>
                      </div>
                    </v-img>
                    <v-card-text class="pa-2 text-center text-caption text-truncate font-weight-medium">
                      {{ img.title }}
                    </v-card-text>
                  </v-card>
                </v-item>
              </v-col>
            </v-row>
          </v-item-group>
          <div v-if="currentAvailableImages.length === 0" class="text-center mt-10 text-grey">
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
import Collection from '@/classes/Collection.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      unsub: [],
      collections: [],
      files: {
        collections_cover: [],
        collections_page: [],
        collections_card: []
      },
      search: '',
      dialog: false,
      imageDialog: false,
      currentImageType: '', // 'coverImage', 'pageImage', or 'cardImage'
      selectedTempImage: null,
      headers: [
        { title: 'Numéro', key: 'number', width: '80px', sortable: true },
        { title: 'Aperçu', key: 'coverImage', width: '80px', sortable: false },
        { title: 'Nom', key: 'name' },
        { title: 'Publique', key: 'isPublic', align: 'center' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ],
      editedItem: {},
      defaultItem: {
        id: null,
        number: 0,
        name: '',
        coverImage: '',
        pageImage: '',
        cardImage: '',
        isPublic: false,
      },
    }
  },
  computed: {
    formTitle() {
      return this.editedItem.id ? 'Modifier la collection' : 'Nouvelle collection'
    },
    availableCoverImages() {
      return this.filterAvailableImages(this.files.collections_cover, 'coverImage');
    },
    availablePageImages() {
      return this.filterAvailableImages(this.files.collections_page, 'pageImage');
    },
    availableCardImages() {
      return this.filterAvailableImages(this.files.collections_card, 'cardImage');
    },
    currentAvailableImages() {
      switch (this.currentImageType) {
        case 'coverImage': return this.availableCoverImages;
        case 'pageImage': return this.availablePageImages;
        case 'cardImage': return this.availableCardImages;
        default: return [];
      }
    },
    currentImageTypeLabel() {
      switch (this.currentImageType) {
        case 'coverImage': return 'Couverture';
        case 'pageImage': return 'Collection';
        case 'cardImage': return 'Carte';
        default: return '';
      }
    }
  },
  created() {
    this.initialize()
    this.loadFiles()
  },
  methods: {
    initialize() {
      this.unsub.push(Collection.listenAll((list) => {
        this.collections = list
        this.collections.sort((a, b) => {
          if (a.number !== b.number) return (a.number || 0) - (b.number || 0);
          return a.name.localeCompare(b.name);
        });
      }))
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
    filterAvailableImages(allImages, fieldName) {
      if (!allImages) return [];
      const usedImages = this.collections
        .filter(c => c.id !== this.editedItem.id) // Exclude current item being edited
        .map(c => c[fieldName])
        .filter(img => img); // Remove empty/null

      // Return objects for v-select with image previews
      return allImages
        .filter(img => !usedImages.includes(img) || img === this.editedItem[fieldName]) // Include current image if editing
        .map(img => ({ title: img, value: img }));
    },
    openDialog() {
      this.editedItem = { ...this.defaultItem };
      this.dialog = true;
    },
    editItem(item) {
      this.editedItem = {
        id: item.id,
        number: item.number || 0,
        name: item.name,
        coverImage: item.coverImage,
        pageImage: item.pageImage,
        cardImage: item.cardImage,
        isPublic: item.isPublic
      };
      this.dialog = true
    },
    openImageSelector(type) {
      this.currentImageType = type;
      this.selectedTempImage = this.editedItem[type];
      this.imageDialog = true;
    },
    confirmImageSelection() {
      this.editedItem[this.currentImageType] = this.selectedTempImage;
      this.imageDialog = false;
    },
    getCurrentImagePath(imgName) {
      let folder = '';
      if (this.currentImageType === 'coverImage') folder = 'collections_cover';
      else if (this.currentImageType === 'pageImage') folder = 'collections_page';
      else if (this.currentImageType === 'cardImage') folder = 'collections_card';
      return `/${folder}/${imgName}`;
    },

    async deleteItem(item) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `ATTENTION : Cela supprimera TOUTES les cartes et TOUS les boosters de la collection "${item.name}", et les retirera de TOUS les profils joueurs. Cette action est irréversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, tout supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          Swal.fire({
            title: 'Suppression massive...',
            text: 'Nettoyage des cartes, boosters et profils en cours',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading()
            }
          });
          try {
            await item.delete();
            logsManager.log(this.userStore.profile.name, 'CONFIG', `Suppression MASSIVE de la collection: ${item.name} (${item.id})`);
            Swal.fire(
              'Supprimé !',
              'La collection et tout son contenu ont été supprimés et nettoyés des profils.',
              'success'
            )
          } catch (e) {
            console.error(e)
            Swal.fire({
              icon: 'error',
              title: 'Erreur',
              text: "Erreur lors de la suppression massive : " + e.message,
            });
          }
        }
      });
    },

    close() {
      this.dialog = false
    },

    async save() {
      try {
        let collection;
        if (this.editedItem.id) {
          collection = new Collection(
            this.editedItem.id,
            this.editedItem.name,
            this.editedItem.coverImage,
            this.editedItem.pageImage,
            this.editedItem.cardImage,
            this.editedItem.isPublic,
            this.editedItem.number
          );
        } else {
          collection = Collection.initOne(this.editedItem.name);
          collection.number = this.editedItem.number || 0;
          collection.coverImage = this.editedItem.coverImage || "";
          collection.pageImage = this.editedItem.pageImage || "";
          collection.cardImage = this.editedItem.cardImage || "";
          collection.isPublic = this.editedItem.isPublic || false;
        }
        await collection.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `${this.editedItem.id ? 'Modification' : 'Création'} de la collection: ${collection.name} (${collection.id})`);
        this.close();

      } catch (e) {
        console.error("Error saving collection:", e);
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
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
