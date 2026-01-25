<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <h1 class="text-center text-primary mb-6">Logs</h1>

      <div class="d-flex justify-center mb-4 gap-4 align-center flex-wrap">
        <v-select v-model="selectedUser" :items="userList" label="Filtrer par utilisateur" density="compact" variant="outlined" style="max-width: 250px;" clearable hide-details class="mx-2"></v-select>

        <v-select v-model="selectedType" :items="typeList" label="Filtrer par type" density="compact" variant="outlined" style="max-width: 250px;" clearable hide-details class="mx-2"></v-select>

        <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher" single-line hide-details density="compact" variant="outlined" style="max-width: 300px;" class="mx-2"></v-text-field>
      </div>

      <v-data-table :headers="headers" :items="filteredLogs" :sort-by="[{ key: 'date', order: 'desc' }]" class="elevation-1" items-per-page="100">
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn v-if="isDev" icon="mdi-delete" variant="text" color="error" size="small" @click="deleteLog(item)"></v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Log from '@/classes/Log.js'

export default {
  props: [],
  data() {
    return {
      unsub: [],
      userStore: useUserStore(),
      selectedUser: null,
      selectedType: null,
      search: '',
      logs: []
    }
  },
  mounted() {
    this.unsub.push(Log.listenAll((logs) => {
      this.logs = logs
    }))
  },
  computed: {
    isDev() {
      return this.userStore.profile.permissions && this.userStore.profile.permissions.includes('dev')
    },
    headers() {
      const baseHeaders = [
        { title: 'Date', key: 'date', align: 'start', sortable: true },
        { title: 'Utilisateur', key: 'user', align: 'start', sortable: true },
        { title: 'Type', key: 'type', align: 'start', sortable: true },
        { title: 'Description', key: 'description', sortable: false },
      ]

      if (this.isDev) {
        baseHeaders.push({ title: '', key: 'actions', sortable: false, align: 'end' })
      }

      return baseHeaders
    },
    userList() {
      const users = new Set(this.logs.map(log => log.user))
      return Array.from(users).sort()
    },
    typeList() {
      const types = new Set(this.logs.map(log => log.type))
      return Array.from(types).sort()
    },
    filteredLogs() {
      let filtered = this.logs

      if (this.selectedUser) {
        filtered = filtered.filter(log => log.user === this.selectedUser)
      }

      if (this.selectedType) {
        filtered = filtered.filter(log => log.type === this.selectedType)
      }

      if (this.search) {
        const query = this.search.toLowerCase()
        filtered = filtered.filter(log =>
          log.user.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          (log.type && log.type.toLowerCase().includes(query))
        )
      }

      return filtered
    }
  },
  methods: {
    async deleteLog(log) {
      if (log) {
        // Since log is an instance of Log class
        await log.delete()
      }
    },
    formatDate(date) {
      if (!date) return '';
      // Si c'est un timestamp Firestore (objet avec seconds)
      if (typeof date === 'object' && date.seconds) {
        return new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(date.toDate());
      }

      // Si c'est un timestamp numérique ou une date
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    }
  },
  beforeUnmount() {
    this.unsub.forEach(unsub => {
      if(typeof unsub === 'function') unsub();
    })
  },
}
</script>
