import * as firebase from 'firebase-admin'
import 'firebase-admin/firestore'
import 'firebase-admin/auth'

import type { SessionsAuthenticateResponse } from 'stytch'

let inited = false
let app: firebase.app.App | undefined = undefined

function init() {
  if (!inited) {
    try {
      // Check if we already have an initialized Firebase app
      try {
        app = firebase.app()
        inited = true
        return
      } catch (e) {
        // No app exists yet, continue with initialization
      }

      // Check if FIREBASE_SA is actually set
      if (!process.env.FIREBASE_SA) {
        console.warn('FIREBASE_SA environment variable is not set. Using development mode.')
        
        // For development mode, use a mock credential with all required fields
        const mockCredential = {
          projectId: 'development-project',
          project_id: 'development-project', // Add both forms for compatibility
          clientEmail: 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
          client_email: 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
          privateKey: 'fake-private-key',
          private_key: 'fake-private-key'
        }
        
        app = firebase.initializeApp({
          projectId: 'development-project',
          credential: firebase.credential.cert(mockCredential as firebase.ServiceAccount),
        })
      } else {
        try {
          // Parse and validate the service account
          const serviceAccount = JSON.parse(process.env.FIREBASE_SA || '{}')
          
          // Ensure all required fields are present with fallbacks
          const certData = {
            projectId: serviceAccount.project_id || serviceAccount.projectId || 'development-project',
            project_id: serviceAccount.project_id || serviceAccount.projectId || 'development-project',
            clientEmail: serviceAccount.client_email || serviceAccount.clientEmail || 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
            client_email: serviceAccount.client_email || serviceAccount.clientEmail || 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
            privateKey: serviceAccount.private_key || serviceAccount.privateKey || 'fake-private-key',
            private_key: serviceAccount.private_key || serviceAccount.privateKey || 'fake-private-key'
          }
          
          app = firebase.initializeApp({
            projectId: certData.projectId,
            credential: firebase.credential.cert(certData as firebase.ServiceAccount),
          })
        } catch (parseError) {
          console.error('Error parsing FIREBASE_SA:', parseError)
          
          // Fall back to development mode credential
          const mockCredential = {
            projectId: 'development-project',
            project_id: 'development-project',
            clientEmail: 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
            client_email: 'firebase-adminsdk-dev@development-project.iam.gserviceaccount.com',
            privateKey: 'fake-private-key',
            private_key: 'fake-private-key'
          }
          
          app = firebase.initializeApp({
            projectId: 'development-project',
            credential: firebase.credential.cert(mockCredential as firebase.ServiceAccount),
          })
        }
      }
    } catch (error) {
      console.error('Error initializing Firebase:', error)
      throw new Error(`Failed to initialize Firebase: ${error}`)
    }
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
