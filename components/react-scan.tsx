'use client'

import { useEffect } from 'react'

export function ReactScan() {
  useEffect(() => {
    // Only load React Scan in development when enabled
    if (
      process.env.NODE_ENV === 'development' && 
      process.env.REACT_SCAN_ENABLED === 'true'
    ) {
      import('react-scan').then((ReactScan) => {
        ReactScan.scan({
          enabled: true,
          log: true, // Log scan results to console
          showToolbar: true, // Show the React Scan toolbar
        })
        console.log('[React Scan] Performance monitoring enabled')
      }).catch((error) => {
        console.warn('[React Scan] Failed to load:', error)
      })
    }
  }, [])

  // This component doesn't render anything
  return null
} 