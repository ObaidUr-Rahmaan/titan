'use client'

import { useEffect } from 'react'
import { useWebVitals } from '@/lib/web-vitals'

export function WebVitals() {
  useEffect(() => {
    // Initialize Web Vitals monitoring on mount
    useWebVitals()
  }, [])

  // This component doesn't render anything
  return null
} 