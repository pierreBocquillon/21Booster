<template>
  <div class="flex-grow-1 overflow-hidden" style="height: 100%;">
    <v-data-table :headers="headers" :items="codes" :search="search" class="h-100" fixed-header hover items-per-page="-1" hide-default-footer>
      <template v-slot:item.end="{ item }">
        {{ formatDate(item.end) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="d-flex gap-2 justify-end">
          <v-btn icon="mdi-pencil" size="small" variant="text" color="primary" @click="$emit('edit', item)"></v-btn>
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="$emit('delete', item)"></v-btn>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'CodeList',
  props: {
    codes: {
      type: Array,
      required: true,
      default: () => []
    },
    search: {
      type: String,
      default: ''
    }
  },
  emits: ['edit', 'delete'],
  data() {
    return {
      headers: [
        { title: 'Nom', key: 'name', width: '20%' },
        { title: 'Description', key: 'description' },
        { title: 'Quantité', key: 'amount', align: 'end' },
        { title: 'Fin', key: 'end', align: 'end' },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ]
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '-';
      return new Date(date).toLocaleDateString();
    }
  }
}
</script>
