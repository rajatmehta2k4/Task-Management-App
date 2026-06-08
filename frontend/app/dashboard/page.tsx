// dashboard/page.tsx — Main page after login
// Shows all tasks, allows creating, updating, and deleting tasks

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchTasks, fetchUsers, fetchCurrentUser, setAuthToken, clearAuthToken, Task, User } from '@/lib/api'
import TaskCard from '@/components/TaskCard'
import TaskForm from '@/components/TaskForm'
import Image from 'next/image'

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // useSearchParams reads URL query parameters like /dashboard?token=...

  // State variables for all the data we display
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [assignedFilter, setAssignedFilter] = useState(false)

  // useCallback memoizes this function — prevents unnecessary re-renders
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch tasks and users in parallel for faster loading
      const [tasksData, usersData, userData] = await Promise.all([
        fetchTasks({ status: statusFilter || undefined, assigned_to_me: assignedFilter }),
        fetchUsers(),
        fetchCurrentUser()
      ])
      // Promise.all runs all 3 requests simultaneously

      setTasks(tasksData)
      setUsers(usersData)
      setCurrentUser(userData)

      // If no user returned, token expired → redirect to login
      if (!userData) {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, assignedFilter, router])
  // Dependencies: re-run when these values change

  useEffect(() => {

    // Check if there's a token in the URL (just returned from OAuth)
    const token = searchParams.get('token')
    if (token) {
      setAuthToken(token)  // Save token to localStorage
      // Clean the URL by removing the token query param
      router.replace('/dashboard')  // replace doesn't add to browser history
      return
    }

    // If no token in URL, check localStorage
    const storedToken = localStorage.getItem('auth_token')
    if (!storedToken) {
      router.push('/')  // Not logged in → go to login
      return
    }

    loadData()
  }, [searchParams, router, loadData])

  function handleLogout() {
    clearAuthToken()
    router.push('/')
  }

  // Called by TaskCard when a task is updated
  function handleTaskUpdate(updatedTask: Task) {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    // prev.map replaces the old task with the updated one (immutable update)
  }

  // Called by TaskCard when a task is deleted
  function handleTaskDelete(taskId: string) {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    // filter removes the deleted task from the list
  }

  // Called by TaskForm when a new task is created
  function handleTaskCreated(newTask: Task) {
    setTasks(prev => [newTask, ...prev])  // Add new task to the top of the list
  }

  // Calculate summary stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          {/* animate-spin makes the loading spinner rotate */}
          <p className="text-gray-500">Loading your tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        {/* sticky top-0 = stays at top when scrolling */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TM</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
        </div>

        <div className="flex items-center gap-4">
          {currentUser?.avatar_url && (
            <Image
              src={currentUser.avatar_url}
              alt={currentUser.full_name}
              width={36}
              height={36}
              className="rounded-full border-2 border-gray-200"
            />
          )}
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {currentUser?.full_name || currentUser?.email}
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-indigo-600' },
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'In Progress', value: stats.inProgress, color: 'text-red-600' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Controls: filters + create button */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <h2 className="text-xl font-bold text-gray-900 mr-auto">Tasks</h2>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border text-gray-900 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Assigned to me filter */}
          <button
            onClick={() => setAssignedFilter(prev => !prev)}
            // Toggle filter on/off
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${assignedFilter
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
          >
            My Tasks
          </button>


          {/* Create task button */}
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            + New Task
          </button>
        </div>

        {/* Task grid */}
        {tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-6">Create your first task to get started</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => (
              <TaskCard
                key={task.id}  // key= is required for lists in React
                task={task}
                currentUserId={currentUser?.id || ''}
                onUpdate={handleTaskUpdate}
                onDelete={handleTaskDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* Task creation modal — only rendered when showCreateForm is true */}
      {showCreateForm && currentUser && (
        <TaskForm
          users={users}
          currentUserId={currentUser.id}
          onTaskCreated={handleTaskCreated}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  )
}