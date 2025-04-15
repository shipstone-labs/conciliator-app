import * as firebase from 'firebase-admin'
import 'firebase-admin/firestore'
import 'firebase-admin/auth'
import 'firebase-admin/storage'
import 'firebase-admin/database'

import type { SessionsAuthenticateResponse } from 'stytch'

let inited = false
let sa: Record<string, unknown> = {}
function init() {
  if (!inited) {
    sa = JSON.parse(process.env.FIREBASE_SA || '{}')
    try {
      firebase.initializeApp({
        credential: firebase.credential.cert(sa),
        databaseURL: process.env.FIREBASE_DB,
      })
    } catch {}
    inited = true
  }
}

export async function getToken(user: SessionsAuthenticateResponse) {
  init()
  const uid = user.user.user_id
  return await firebase.auth().createCustomToken(uid)
}

export function getFirestore() {
  init()
  return firebase.firestore()
}

export function getStorage() {
  init()
  return firebase.storage()
}

export function getBucket() {
  init()
  return firebase.storage().bucket(`${sa.project_id}.firebasestorage.app`)
}

export function getFirebase() {
  init()
  return firebase.database()
}
