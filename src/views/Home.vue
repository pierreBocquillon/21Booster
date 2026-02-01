<template>
  <div class="pa-5" style="min-height: calc(100vh - 120px); height: 100%;">
    <v-card class="rounded-xl" style="max-width: 920px; margin: auto;">
      <v-card-text class="pa-5 d-flex flex-column align-center">
        <div>
          <h2 class="text-center mb-2">Nom : <span class=" text-h5 font-weight-regular">{{ userStore.profile.name }}</span></h2>
        </div>

        <div class="my-3 w-100">
          <v-divider class="border-opacity-75"></v-divider>
        </div>

        <div class="d-flex align-center justify-center flex-wrap">
          <div v-for="group in filteredNavItems" class="d-flex align-center justify-center flex-wrap">
            <v-btn v-for="item in group" :key="item.link" style="width: 190px; height: 190px;" class="rounded-lg ma-2" @click="$router.push(item.link)">
              <div class="d-flex flex-column align-center justify-center mb-4">
                <v-img height="140" width="140" :src="`/nav/${item.icon}`"></v-img>
                <h4 class="font-weight-regular w-100 text-center mt-3" style="height: 16px;white-space: normal;">{{ item.title }}</h4>
              </div>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { useUserStore } from '@/store/user.js'

import navItems from '@/config/navItems.js'
import permissions from '@/config/permissions'

export default {
  props: [],
  data() {
    return {
      userStore: useUserStore(),
      permissions,
      navItems,
    }
  },
  computed: {
    filteredNavItems() {
      let filteredItems = []
      let currentGroup = []
      for (let group of this.navItems) {
        for (let item of group) {
          let tmp_item = JSON.parse(JSON.stringify(item))
          tmp_item.permissions = []

          let itemRoute = this.$router.resolve({ path: tmp_item.link })
          if (itemRoute && itemRoute.meta && itemRoute.meta.permissions) {
            tmp_item.permissions = itemRoute.meta.permissions
          }

          let userPerms = this.userStore.profile?.permissions;
          let hasAccess = false

          if (tmp_item.permissions.length <= 0) hasAccess = true
          else if (userPerms && userPerms.some(p => ['dev', 'admin'].includes(p))) hasAccess = true
          else if (userPerms && tmp_item.permissions.some(p => userPerms.includes(p))) hasAccess = true

          if (hasAccess && tmp_item.link != this.$route.path) {
            currentGroup.push(tmp_item)
          }
        }
        if (currentGroup.length > 0) {
          filteredItems.push(currentGroup)
          currentGroup = []
        }
      }
      return filteredItems
    },
  }
}
</script>