import admin from 'firebase-admin'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { onCall } from 'firebase-functions/v2/https'

import serviceAccount from "./serviceAccountKey.js"

let app = initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

let auth = getAuth(app)

export const changePassword = onCall(async (req, res) => {
  let userId = req.data.userId
  let hash = req.data.hash

  let newPassword = atob(hash)

  return await auth.updateUser(userId,{password: newPassword})
})

export const getToken = onCall(async (req, res) => {
  let userId = req.data.userId

  let token = await auth.createCustomToken(userId)
  return token
})
