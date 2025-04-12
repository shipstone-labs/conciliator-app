'use client'

// import { createLitClient, LitNetworks } from "lit-wrapper";
import HomeApp from '@/components/home-app'

export default function Home() {
  // Log Home component render
  console.log(`[HYDRATION][${typeof window === 'undefined' ? 'SERVER' : 'CLIENT'}] Home component rendering`);
  
  return <HomeApp />
}
