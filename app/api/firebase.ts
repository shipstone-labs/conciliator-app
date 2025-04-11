import * as firebase from 'firebase-admin'
import 'firebase-admin/firestore'
import 'firebase-admin/auth'

import type { SessionsAuthenticateResponse } from 'stytch'

let inited = false
function init() {
  if (!inited) {
    try {
      firebase.initializeApp({
        credential: firebase.credential.cert(
          JSON.parse(process.env.FIREBASE_SA || '{}')
        ),
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

export async function getFirestore() {
  init()
  return firebase.firestore()
}
