<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <h1 class="text-center text-primary mb-6">Logs</h1>

      <div class="d-flex justify-center mb-4 gap-4 align-center flex-wrap">
        <v-select v-model="selectedUser" :items="userList" label="Filtrer par utilisateur" density="compact" variant="outlined" style="max-width: 250px;" clearable hide-details class="mx-2" @update:model-value="fetchLogs"></v-select>

        <v-select v-model="selectedType" :items="typeList" label="Filtrer par type" density="compact" variant="outlined" style="max-width: 250px;" clearable hide-details class="mx-2" @update:model-value="fetchLogs"></v-select>

        <v-btn icon color="secondary" @click="fetchLogs" title="Actualiser les logs" density="compact" class="mx-2">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </div>

      <v-data-table :headers="headers" :items="logs" :loading="loading" :sort-by="[{ key: 'date', order: 'desc' }]" class="elevation-1" items-per-page="100" hide-default-footer>
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn v-if="isDev" icon="mdi-delete" variant="text" color="error" size="small" @click="deleteLog(item)"></v-btn>
        </template>
      </v-data-table>
      
      <div class="text-center pt-2">
        <v-pagination v-model="page" :length="totalPages" @update:model-value="fetchLogs"></v-pagination>
      </div>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'
import Log from '@/classes/Log.js'
import Profile from '@/classes/Profile.js'

export default {
  props: [],
  data() {
    return {
      userStore: useUserStore(),
      selectedUser: null,
      selectedType: null,
      logs: [],
      page: 1,
      totalLogs: 0,
      pageSize: 50,
      loading: false,
      userList: [],
      typeList: ['OPEN', 'CASINO', 'BUY', 'MODERATION', 'DESTROY', 'DAILY_BONUS', 'CODE', 'EASTER_EGG', 'CONFIG' , 'TRANSACTION', 'RESET', 'PASSWORD']
    }
  },
  mounted() {
    this.fetchUsers()
    this.fetchLogs()
  },
  computed: {
    totalPages() {
      const pages = Math.ceil(this.totalLogs / this.pageSize) || 1
      return pages > 10 ? 10 : pages
    },
    isDev() {
      return this.userStore.profile.permissions && this.userStore.profile.permissions.includes('dev')
    },
    headers() {
      const baseHeaders = [
        { title: 'Date', key: 'date', align: 'start', sortable: false },
        { title: 'Utilisateur', key: 'user', align: 'start', sortable: false },
        { title: 'Type', key: 'type', align: 'start', sortable: false },
        { title: 'Description', key: 'description', sortable: false },
      ]

      if (this.isDev) {
        baseHeaders.push({ title: '', key: 'actions', sortable: false, align: 'end' })
      }

      return baseHeaders
    },
  },
  methods: {
    async fetchUsers() {
      try {
        const profiles = await Profile.getAll()
        this.userList = profiles.map(p => p.name).sort()
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs", error)
      }
    },
    async fetchLogs() {
      this.loading = true
      try {
        const filters = {}
        if (this.selectedUser) filters.user = this.selectedUser
        if (this.selectedType) filters.type = this.selectedType

        this.totalLogs = await Log.getCount(filters)
        this.logs = await Log.getByPage(this.page, this.pageSize, filters)
        
      } catch (e) {
        console.error("Erreur lors du chargement des logs", e)
      } finally {
        this.loading = false
      }
    },
    async deleteLog(log) {
      if (log) {
        // Since log is an instance of Log class
        await log.delete()
        this.fetchLogs()
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
}
</script>

