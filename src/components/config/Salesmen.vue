<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="pa-5 rounded-xl h-100 d-flex flex-column">
      <div class="d-flex justify-space-between align-center mb-5 shrink">
        <h1 class="text-primary">Vendeurs</h1>
        <div class="d-flex gap-4 align-center flex-grow-1 mx-10">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" variant="outlined" density="compact" hide-details class="rounded-lg"></v-text-field>
        </div>
        <v-btn color="primary" @click="openDialog">
          <v-icon start>mdi-plus</v-icon>
          Ajouter un vendeur
        </v-btn>
      </div>

      <div class="flex-grow-1 overflow-hidden" style="height: 100%;">
        <v-data-table :headers="headers" :items="salesmen" :search="search" class="h-100" fixed-header hover items-per-page="-1" hide-default-footer>
          <template v-slot:item.actions="{ item }">
            <div class="d-flex gap-2 justify-end">
              <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="editItem(item)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteItem(item)"></v-btn>
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ editedItem.id ? 'Modifier' : 'Ajouter' }} un vendeur
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.firstname" label="Prénom" color="primary"></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="editedItem.lastname" label="Nom" color="primary"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="editedItem.phone" label="Téléphone" color="primary"></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" variant="text" @click="dialog = false">Annuler</v-btn>
          <v-btn color="primary" variant="tonal" @click="save" class="px-5 rounded-lg">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Salesman from '@/classes/Salesman.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'

export default {
  data() {
    return {
      userStore: useUserStore(),
      unsub: null,
      salesmen: [],
      search: '',
      headers: [
        { title: 'Prénom', key: 'firstname' },
        { title: 'Nom', key: 'lastname' },
        { title: 'Téléphone', key: 'phone' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ],
      dialog: false,
      editedItem: {
        id: null,
        firstname: '',
        lastname: '',
        phone: '',
      },
      defaultItem: {
        id: null,
        firstname: '',
        lastname: '',
        phone: '',
      },
    }
  },
  created() {
    Salesman.listenAll((list) => {
      this.salesmen = list
    }).then(unsub => {
      this.unsub = unsub
    })
  },
  methods: {
    openDialog() {
      this.editedItem = { ...this.defaultItem };
      this.dialog = true;
    },
    editItem(item) {
      this.editedItem = {
        id: item.id,
        firstname: item.firstname,
        lastname: item.lastname,
        phone: item.phone,
      };
      this.dialog = true
    },
    async deleteItem(item) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer le vendeur "${item.firstname} ${item.lastname}" ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await item.delete();
          logsManager.log(this.userStore.profile.name, 'CONFIG', `Suppression du vendeur: ${item.firstname} ${item.lastname}`);
        }
      });
    },
    async save() {
      try {
        let salesman;
        if (this.editedItem.id) {
          salesman = new Salesman(this.editedItem.id, this.editedItem.firstname, this.editedItem.lastname, this.editedItem.phone);
        } else {
          salesman = new Salesman(null, this.editedItem.firstname, this.editedItem.lastname, this.editedItem.phone);
        }
        await salesman.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `${this.editedItem.id ? 'Modification' : 'Création'} du vendeur: ${salesman.firstname} ${salesman.lastname}`);
        this.dialog = false;
      } catch (e) {
        console.error("Error saving salesman:", e);
      }
    },
  },
  beforeUnmount() {
    if (this.unsub) this.unsub();
  },
}
</script>
