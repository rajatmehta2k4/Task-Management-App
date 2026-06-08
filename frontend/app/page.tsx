// page.tsx — The homepage / login page
// In Next.js App Router, page.tsx is what's shown at the route
// This file = the page at "/" (root URL)

'use client'  // This tells Next.js this is a Client Component (runs in browser)
// Without 'use client', it runs on the server and can't use useState, useEffect, etc.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { LuClipboard } from 'react-icons/lu'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LoginPage() {
  const router = useRouter()
  
  useEffect(() => {

    // Check if user is already logged in
    const token = localStorage.getItem('auth_token')
    if (token) {
      router.push('/dashboard')  // Redirect to dashboard if already logged in
    }
  }, [router])
  // The [] dependency array means "run this effect only once, on first render"
  
  function handleGoogleLogin() {
    // Flask will then redirect to Google's login page
    window.location.href = `${API_URL}/api/auth/google`
  }
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      {/* min-h-screen = full viewport height, flex = flexbox, items-center = vertically center */}
      
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md text-center">
        <div className="mb-8">
          {/* App logo/icon */}
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LuClipboard size={30}/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-gray-500 mt-2">Collaborate with your team</p>
        </div>
        
        
        {/* Google Sign In button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-3 text-gray-700 font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 cursor-pointer"
        >
          {/* Google SVG logo */}
          <FcGoogle size={20}/>
          Sign in with Google
        </button>
        
      </div>
    </main>
  )
}