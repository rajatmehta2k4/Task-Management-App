// route.ts — Next.js API Route for handling the OAuth callback
// This handles the case where Supabase redirects back to the frontend
// File location = API endpoint at /api/auth/callback

import { NextRequest, NextResponse } from 'next/server'

// Next.js App Router uses these named exports for HTTP methods
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  
  // Extract the token from URL query parameters
  // Our Flask backend redirects here with: /dashboard?token=...
  const token = requestUrl.searchParams.get('token')
  
  if (token) {
    // Redirect to dashboard — client-side code will store the token
    return NextResponse.redirect(new URL(`/dashboard?token=${token}`, request.url))
  }
  
  // If no token, redirect to login with error
  return NextResponse.redirect(new URL('/login?error=no_token', request.url))
}