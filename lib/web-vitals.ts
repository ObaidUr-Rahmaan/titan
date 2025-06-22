import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

// Type for Web Vitals metric
interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
}

// Send metrics to analytics (can be extended to send to your analytics service)
function sendToAnalytics(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id
    })
  }

  // Send to Vercel Analytics if available
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('track', 'Web Vitals', {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating
    })
  }

  // You can extend this to send to other analytics services
  // Example: Google Analytics, PostHog, etc.
}

// Initialize Web Vitals monitoring
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Cumulative Layout Shift
  onCLS(sendToAnalytics)
  
  // First Contentful Paint  
  onFCP(sendToAnalytics)
  
  // Interaction to Next Paint (replaces FID)
  onINP(sendToAnalytics)
  
  // Largest Contentful Paint
  onLCP(sendToAnalytics)
  
  // Time to First Byte
  onTTFB(sendToAnalytics)
}

// React hook for Web Vitals
export function useWebVitals() {
  if (typeof window !== 'undefined') {
    initWebVitals()
  }
}

// Export individual metric functions for custom usage
export { onCLS, onFCP, onINP, onLCP, onTTFB } 