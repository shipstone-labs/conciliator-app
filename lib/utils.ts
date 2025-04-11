import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
export { getAnalytics } from 'firebase/analytics'
export { getFirestore } from 'firebase/firestore'

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDLj-a9Zx3_BZl7Ht7wIVzQOoYT0BKIq_A',
  authDomain: 'conciliator-b41c1.firebaseapp.com',
  projectId: 'conciliator-b41c1',
  storageBucket: 'conciliator-b41c1.firebasestorage.app',
  messagingSenderId: '520982535775',
  appId: '1:520982535775:web:70ab80b8110db75d0605ea',
  measurementId: 'G-2ZLL9L62PZ',
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function makeOpenAIRequest(
  messages: Array<{
    role: string
    content: string
  }>
) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your key and try again.')
      }
      if (response.status === 429) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment and try again.'
        )
      }
      if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.')
      }
      throw new Error(
        errorData.error?.message ||
          `API error (${response.status}): ${response.statusText}`
      )
    }

    return await response.json()
  } catch (err) {
    if (
      (err as { name: string }).name === 'TypeError' &&
      (err as { message: string }).message === 'Failed to fetch'
    ) {
      throw new Error(
        'Network error: Unable to reach OpenAI API. Please check your internet connection and try again.'
      )
    }
    throw err
  }
}
