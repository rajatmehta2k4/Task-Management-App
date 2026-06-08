'use client'

import { Suspense } from 'react'
import DashboardContent from './DashboardContent'

// Suspense boundary is required by Next.js 14 when using useSearchParams()
// It shows a loading state while the component reads URL parameters
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}