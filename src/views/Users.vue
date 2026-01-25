<template>
  <div style="height: calc(100% - 42px);">
    <v-card class="ma-5 pa-5 rounded-xl h-100">
      <div>
        <UsersTab />
      </div>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import UsersTab from '@/components/users/UsersTab.vue'

export default {
  props: [],
  components: {
    UsersTab,
  },
  data() {
    return {
      userStore: useUserStore(),
      tab: 'users',
    }
  },
}
</script>
