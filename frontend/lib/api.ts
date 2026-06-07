// api.ts — Functions for calling our Flask backend API
// Centralizing API calls here means if the URL changes, we only update one file

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Helper function: gets the auth token from localStorage
// We store the token after login and include it with every request
function getAuthToken(): string | null {
  // typeof window check prevents errors during server-side rendering (SSR)
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

// Helper function: builds headers including the auth token
function getHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',  // We're sending JSON
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    // Spread operator (...) adds Authorization header only if token exists
  }
}

// TypeScript interfaces define the shape of our data objects
// This gives us autocomplete and catches errors at compile time
export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'  // Can only be one of these
  priority: 'low' | 'medium' | 'high'
  due_date: string | null
  created_by: string
  assigned_to: string | null
  created_at: string
  updated_at: string
  // Joined profile data (comes from our SELECT with profiles)
  created_by_profile?: { id: string; full_name: string; email: string; avatar_url: string }
  assigned_to_profile?: { id: string; full_name: string; email: string; avatar_url: string }
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string
}

export interface CreateTaskData {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
  assigned_to?: string
}

// ─── API Functions ───────────────────────────────────────────────────────────

export async function fetchTasks(filters?: { status?: string; assigned_to_me?: boolean }): Promise<Task[]> {
  // Build query string from filters object
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.assigned_to_me) params.set('assigned_to_me', 'true')
  
  const queryString = params.toString()
  const url = `${API_URL}/api/tasks/${queryString ? '?' + queryString : ''}`
  
  const response = await fetch(url, {
    headers: getHeaders()
  })
  
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }
  
  // Parse JSON response and return as Task[]
  const data = await response.json()
  return data as Task[]
}

export async function createTask(taskData: CreateTaskData): Promise<Task> {
  const response = await fetch(`${API_URL}/api/tasks/`, {
    method: 'POST',  // HTTP POST to create a new resource
    headers: getHeaders(),
    body: JSON.stringify(taskData)  // Convert JS object to JSON string
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create task')
  }
  
  return response.json()
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  // Partial<Task> means any subset of Task fields (TypeScript utility type)
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'PUT',  // HTTP PUT to update an existing resource
    headers: getHeaders(),
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update task')
  }
  
  return response.json()
}

export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
    method: 'DELETE',  // HTTP DELETE to remove a resource
    headers: getHeaders()
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete task')
  }
  // No return value needed for delete
}

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(`${API_URL}/api/tasks/users`, {
    headers: getHeaders()
  })
  
  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken()
  if (!token) return null  // Not logged in
  
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: getHeaders()
  })
  
  if (!response.ok) return null
  return response.json()
}

// Store auth token after login
export function setAuthToken(token: string) {
  localStorage.setItem('auth_token', token)
}

// Remove token on logout
export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}