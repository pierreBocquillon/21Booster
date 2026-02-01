<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100 d-flex flex-column">
      <div class="d-flex justify-space-between align-center mb-5 shrink">
        <h1 class="text-primary">Codes</h1>
        <div class="d-flex gap-4 align-center flex-grow-1 mx-10">
          <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" variant="outlined" density="compact" hide-details class="rounded-lg pr-3"></v-text-field>
          <v-select v-model="filterCollection" :items="[{id: null, name: 'Toutes les collections'}, ...collectionOptions]" item-title="name" item-value="id" label="Filtrer par collection" variant="outlined" density="compact" hide-details class="rounded-lg" style="max-width: 300px;"></v-select>
        </div>
        <v-btn color="primary" @click="openDialog">
          <v-icon start>mdi-plus</v-icon>
          Ajouter un code
        </v-btn>
      </div>

      <CodeList :codes="filteredCodes" :search="search" @edit="editItem" @delete="deleteItem" />
    </v-card>

    <CodeDialog v-model="dialog" :item="editedItem" :boosters="boosterOptions" :cards="cardOptions" :collections="collectionOptions" :rarities="rarityOptions" @save="save" />
  </div>
</template>

<script>
import Code from '@/classes/Code.js'
import Booster from '@/classes/Booster.js'
import Card from '@/classes/Card.js'
import Collection from '@/classes/Collection.js'
import Swal from 'sweetalert2/dist/sweetalert2.js'
import { useUserStore } from '@/store/user.js'
import logsManager from '@/assets/functions/logsManager.js'
import CodeList from '@/components/configCodes/CodeList.vue'
import CodeDialog from '@/components/configCodes/CodeDialog.vue'

export default {
  components: {
    CodeList,
    CodeDialog
  },
  data() {
    return {
      userStore: useUserStore(),
      unsub: [],
      codes: [],
      search: '',
      filterCollection: null,
      dialog: false,
      editedItem: {},
      defaultItem: {
        id: null,
        name: '',
        description: '',
        end: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().substr(0, 10),
        amount: 0,
        collections: [],
        cards: [],
        boosters: [],
        cash: 0,
      },
      boosterOptions: [],
      cardOptions: [],
      collectionOptions: [],
      rarityOptions: [
        { id: 'common', name: 'Classique' },
        { id: 'silver', name: 'Silver' },
        { id: 'golden', name: 'Golden' },
        { id: 'foil', name: 'Foil' },
      ],
    }
  },
  computed: {
    filteredCodes() {
      if (!this.filterCollection) return this.codes;
      return this.codes.filter(c => c.collection === this.filterCollection);
    }
  },
  created() {
    this.unsub.push(Code.listenAll((list) => {
      this.codes = list
    }))
    this.unsub.push(Booster.listenAll((list) => {
      this.boosterOptions = list
    }))
    this.unsub.push(Card.listenAll((list) => {
      this.cardOptions = list
    }))
    this.unsub.push(Collection.listenAll((list) => {
      this.collectionOptions = list
    }))
  },
  methods: {
    openDialog() {
      this.editedItem = { ...this.defaultItem };
      this.dialog = true;
    },
    editItem(item) {
      let endDate = item.end;
      if (typeof item.end === 'number') {
        endDate = new Date(item.end).toISOString().substr(0, 10);
      }

      this.editedItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        end: endDate,
        amount: item.amount,
        collections: item.collections || [],
        cards: item.cards || [],
        boosters: item.boosters || [],
        cash: item.cash
      };
      this.dialog = true
    },

    async deleteItem(item) {
      Swal.fire({
        title: 'Êtes-vous sûr ?',
        text: `Voulez-vous vraiment supprimer le code "${item.name}" ? Cette action est irréversible.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Annuler'
      }).then(async (result) => {
        if (result.isConfirmed) {
          await item.delete();
          logsManager.log(this.userStore.profile.name, 'CONFIG', `Suppression du code: ${item.name} (${item.id})`);
        }
      });
    },

    async save(formData) {
      try {
        const endDate = formData.end ? new Date(formData.end).getTime() : "";
        let code;
        if (formData.id) {
          code = new Code(
            formData.id,
            formData.name,
            formData.description,
            endDate,
            formData.amount,
            formData.cash || 0,
            formData.collections || [],
            formData.cards || [],
            formData.boosters || []
          );
        } else {
          code = Code.initOne(formData.name);
          code.description = formData.description || "";
          code.end = endDate || "";
          code.amount = formData.amount || 0;
          code.cash = formData.cash || 0;
          code.collections = formData.collections || [];
          code.cards = formData.cards || [];
          code.boosters = formData.boosters || [];
        }
        await code.save();
        logsManager.log(this.userStore.profile.name, 'CONFIG', `${formData.id ? 'Modification' : 'Création'} du code: ${code.name} (${code.id})`);
        this.dialog = false;
      } catch (e) {
        console.error("Error saving code:", e);
        alert("Erreur lors de l'enregistrement: " + e.message);
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
