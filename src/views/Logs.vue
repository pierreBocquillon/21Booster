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
      <div class="d-flex align-center justify-center">
        <v-btn color="green" @click="extractSalesData" class="mx-2">
          <v-icon>mdi-database-arrow-down</v-icon>
          Extraire les données de vente
        </v-btn>
        <!-- <v-btn color="green" @click="extractBalancingData" class="mx-2">
          <v-icon>mdi-finance</v-icon>
          Extraire les données d'aquilibrage
        </v-btn> -->
      </div>
    </v-card>
  </div>
</template>

<script>
import XLSX from 'xlsx-js-style'
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
      typeList: ['OPEN', 'CASINO', 'BUY', 'MODERATION', 'DESTROY', 'AUTO_DESTROY' , 'DAILY_BONUS', 'CODE', 'EASTER_EGG', 'CONFIG', 'TRANSACTION', 'RESET', 'PASSWORD']
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
    async extractSalesData() {
      try {
        const logs = await Log.getAllByFilters({ type: 'TRANSACTION' })

        // Sheet 1: Raw Data
        const rawData = logs.map(log => {
          let dateObj;
          if (log.date && typeof log.date === 'object' && log.date.seconds) {
            dateObj = new Date(log.date.seconds * 1000)
          } else {
            dateObj = new Date(log.date)
          }

          const pad = (n) => n.toString().padStart(2, '0')
          const dateStr = `${pad(dateObj.getDate())}-${pad(dateObj.getMonth() + 1)}-${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`

          return {
            Date: dateStr,
            Utilisateur: log.user,
            Type: log.type,
            Description: log.description
          }
        })

        // Sheet 2: Aggregated Data
        const salesData = {}
        const weeksSet = new Set()

        logs.forEach(log => {
          let dateObj;
          if (log.date && typeof log.date === 'object' && log.date.seconds) {
            dateObj = new Date(log.date.seconds * 1000)
          } else {
            dateObj = new Date(log.date)
          }

          const weekRange = this.getWeekRange(dateObj)
          weeksSet.add(weekRange)

          const seller = log.user

          if (!salesData[seller]) salesData[seller] = {}
          if (!salesData[seller][weekRange]) salesData[seller][weekRange] = { coins: 0, boosters: 0, cards: 0 }

          const desc = log.description

          // Card Coins
          const coinMatch = desc.match(/A ajouté (\d+) card coin\(s\) à/)
          if (coinMatch) {
            salesData[seller][weekRange].coins += parseInt(coinMatch[1])
          }

          // Boosters
          const boosterMatch = desc.match(/A ajouté (\d+)x booster ".*?"/)
          if (boosterMatch) {
            salesData[seller][weekRange].boosters += parseInt(boosterMatch[1])
          }

          // Cards
          const cardMatch = desc.match(/A ajouté (\d+)x carte ".*?"/)
          if (cardMatch) {
            salesData[seller][weekRange].cards += parseInt(cardMatch[1])
          }

          // Giveaway
          if (desc.startsWith("A effectué une distribution collective")) {
            const usersMatch = desc.match(/distribution collective à (\d+) utilisateurs/)
            const userCount = usersMatch ? parseInt(usersMatch[1]) : 0

            if (userCount > 0) {
              const cashMatch = desc.match(/(\d+) cash/)
              if (cashMatch) {
                salesData[seller][weekRange].coins += parseInt(cashMatch[1]) * userCount
              }
              const boosterGiveawayMatch = desc.match(/(\d+)x booster/)
              if (boosterGiveawayMatch) {
                salesData[seller][weekRange].boosters += parseInt(boosterGiveawayMatch[1]) * userCount
              }
              const cardGiveawayMatch = desc.match(/(\d+)x card/)
              if (cardGiveawayMatch) {
                salesData[seller][weekRange].cards += parseInt(cardGiveawayMatch[1]) * userCount
              }
            }
          }
        })

        // Prepare Double Entry Table
        const sellers = Object.keys(salesData).sort()
        const weeks = Array.from(weeksSet).sort((a, b) => {
          const parseDate = (d) => {
            const parts = d.substring(0, 10).split('/')
            return new Date(parts[2], parts[1] - 1, parts[0])
          }
          return parseDate(a) - parseDate(b)
        })

        // Headers
        const header1 = ["Semaine"]
        const header2 = [""]
        const merges = [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]

        sellers.forEach((seller, index) => {
          header1.push(seller)
          header1.push("") // Coins
          header1.push("") // Boosters
          // header1.push("") - this placeholder logic for header1 needs to match number of columns added in header2 per seller
          // Actually simplest way is merged cells logic.
          // Seller name spans 3 columns now.

          header2.push("Card Coins")
          header2.push("Boosters")
          header2.push("Cartes")

          // Merge for seller name (start col: 1 + index*3, end col: 1 + index*3 + 2)
          const colIndex = 1 + index * 3
          merges.push({ s: { r: 0, c: colIndex }, e: { r: 0, c: colIndex + 2 } })
        })

        // Fix header1 placeholders to match length of header2
        // header1 has 1 (Semaine) + sellers.length * 1 (Name) + placeholders
        // We need header1 to be sparse with names at start of merge ranges
        const newHeader1 = ["Semaine"]
        sellers.forEach(seller => {
          newHeader1.push(seller)
          newHeader1.push("")
          newHeader1.push("")
        })

        const ws_data = [newHeader1, header2]

        // Rows
        weeks.forEach(week => {
          const row = [week]
          sellers.forEach(seller => {
            const data = salesData[seller][week]
            row.push(data ? data.coins : 0)
            row.push(data ? data.boosters : 0)
            row.push(data ? data.cards : 0)
          })
          ws_data.push(row)
        })

        const wb = XLSX.utils.book_new()
        const ws1 = XLSX.utils.json_to_sheet(rawData)
        const ws2 = XLSX.utils.aoa_to_sheet(ws_data)

        ws2['!merges'] = merges

        // Calculate column widths for Sales Sheet
        const colWidths = [
          { wch: 25 }, // Semaine
        ]

        // For each seller group (3 columns)
        sellers.forEach(() => {
          colWidths.push({ wch: 10 }) // Card Coins
          colWidths.push({ wch: 10 }) // Boosters
          colWidths.push({ wch: 10 }) // Cartes Distribuées
        })

        ws2['!cols'] = colWidths

        // Define generic style function
        const addStyles = (ws, headerRows = 1) => {
            if (!ws['!ref']) return
            const range = XLSX.utils.decode_range(ws['!ref']);
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_address = { c: C, r: R };
                    const cell_ref = XLSX.utils.encode_cell(cell_address);
                    if (!ws[cell_ref]) continue;
                    
                    if (!ws[cell_ref].s) ws[cell_ref].s = {};
                    
                    // Borders
                    ws[cell_ref].s.border = {
                        top: { style: "thin" },
                        bottom: { style: "thin" },
                        left: { style: "thin" },
                        right: { style: "thin" }
                    };

                    // Header alignment and bold
                    if (R < headerRows) {
                        ws[cell_ref].s.alignment = { horizontal: "center", vertical: "center" };
                        ws[cell_ref].s.font = { bold: true };
                    }
                }
            }
        }
        
        // Apply styles to sales sheet (2 header rows)
        addStyles(ws2, 2)

        XLSX.utils.book_append_sheet(wb, ws2, "Ventes par Semaine")

        // Per-seller sheets
        sellers.forEach(seller => {
          const sellerLogs = rawData.filter(l => l.Utilisateur === seller)
          // Sanitize sheet name (max 31 chars, no special chars allowed in Excel sheets usually, but xlsx handles some)
          // Just trimming to 31 chars to be safe
          const sheetName = 'Logs - ' + seller.substring(0, 20) // Reduced to leave room for prefix
          const wsSeller = XLSX.utils.json_to_sheet(sellerLogs)

          // Calculate widths for seller sheets
          const maxDescLength = sellerLogs.reduce((max, row) => Math.max(max, (row.Description || '').length), 11)
          const maxUserLength = sellerLogs.reduce((max, row) => Math.max(max, (row.Utilisateur || '').length), 11)

          wsSeller['!cols'] = [
            { wch: 20 }, // Date
            { wch: Math.min(Math.max(maxUserLength, 12), 30) }, // Utilisateur
            { wch: 15 }, // Type
            { wch: Math.min(Math.max(maxDescLength, 12), 100) } // Description
          ]

          // Apply styles to seller sheet (1 header row)
          addStyles(wsSeller, 1)

          XLSX.utils.book_append_sheet(wb, wsSeller, sheetName)
        })

        XLSX.writeFile(wb, "Rapport_Ventes.xlsx")

      } catch (e) {
        console.error("Erreur export excel", e)
      }
    },
    async extractBalancingData() {
      try {
        const types = ['TRANSACTION', 'BUY', 'RESET', 'CODE']
        let allLogs = []

        for (const type of types) {
           const typeLogs = await Log.getAllByFilters({ type })
           allLogs = allLogs.concat(typeLogs)
        }

        // Tri par date croissante pour rejouer l'historique
        allLogs.sort((a, b) => {
          let dateA = (a.date && a.date.seconds) ? a.date.seconds * 1000 : new Date(a.date).getTime()
          let dateB = (b.date && b.date.seconds) ? b.date.seconds * 1000 : new Date(b.date).getTime()
          return dateA - dateB
        })

        const userStats = {}
        const getStats = (username) => {
          if (!userStats[username]) {
            userStats[username] = {
              initialCards: 0,
              codeBoosters: 0,
              codeCoins: 0,
              boughtCoins: 0,
              boughtBoosters: 0
            }
          }
          return userStats[username]
        }

        for (const log of allLogs) {
          const user = log.user
          const desc = log.description || ""

          if (log.type === 'RESET') {
            if (userStats[user]) {
              // Réinitialisation des stats de cet utilisateur
              delete userStats[user]
            }
            continue
          }

          if (log.type === 'TRANSACTION') {
             // "A ajouté X card coin(s) à USER"
             const match = desc.match(/A ajouté (\d+) card coin\(s\) à (.*)/)
             if (match) {
                 const amount = parseInt(match[1])
                 const targetUser = match[2].trim()
                 getStats(targetUser).boughtCoins += amount
             }
          } else if (log.type === 'BUY') {
              // "Acheté X booster(s)"
              const match = desc.match(/Acheté (\d+) booster\(s\)/)
              if (match) {
                  getStats(user).boughtBoosters += parseInt(match[1])
              }
          } else if (log.type === 'CODE') {
              const isOld = desc.toLowerCase().includes('old') || desc.toLowerCase().includes('héritage') || desc.toLowerCase().includes('ancien temps')

              if (isOld) {
                  const match = desc.match(/(\d+)\s+Carte/i)
                  if (match) {
                      getStats(user).initialCards += parseInt(match[1])
                  }
              } else {
                  const boosterMatch = desc.match(/(\d+)\s+Booster/i)
                  if (boosterMatch) {
                      getStats(user).codeBoosters += parseInt(boosterMatch[1])
                  }

                  const coinMatch = desc.match(/(\d+)\s+Card coin/i)
                  if (coinMatch) {
                      getStats(user).codeCoins += parseInt(coinMatch[1])
                  }
              }
          }
        }

        // Génération Excel
        const headers = [
             "Nom", 
             "Cartes Initiales (Old)", 
             "Boosters (Code)", 
             "Card Coins (Code)", 
             "Card Coins Achetés", 
             "Boosters Achetés"
        ]
        
        const data = Object.keys(userStats).sort().map(user => {
            const s = userStats[user]
            return {
                "Nom": user,
                "Cartes Initiales (Old)": s.initialCards,
                "Boosters (Code)": s.codeBoosters,
                "Card Coins (Code)": s.codeCoins,
                "Card Coins Achetés": s.boughtCoins,
                "Boosters Achetés": s.boughtBoosters
            }
        })
        
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(data, { header: headers }) // force order
        
        // Auto-width
        const wscols = headers.map(h => ({ wch: h.length + 5 }))
        // Adjust known columns if needed
        wscols[0] = { wch: 20 } // Name
        ws['!cols'] = wscols
        
        XLSX.utils.book_append_sheet(wb, ws, "Balancing Data")
        XLSX.writeFile(wb, "Balancing_Data.xlsx")

      } catch (e) {
        console.error("Erreur extractBalancingData", e)
      }
    },
    getWeekRange(date) {
      const current = new Date(date);
      const day = current.getDay();
      const diff = current.getDate() - day + (day === 0 ? -6 : 1);

      const monday = new Date(current.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const formatDate = (date) => {
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      }
      return `${formatDate(monday)} - ${formatDate(sunday)}`
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
