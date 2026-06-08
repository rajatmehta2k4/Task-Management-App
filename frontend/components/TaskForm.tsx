// TaskForm.tsx — Modal form for creating a new task

'use client'

import { useState } from 'react'
import { createTask, CreateTaskData, User, Task  } from '@/lib/api'

interface TaskFormProps {
    users: User[]              // List of all users (for assignment dropdown)
    currentUserId: string
    onTaskCreated: (task: Task) => void  // Called after successful task creation
    onClose: () => void        // Called to close the modal
}

export default function TaskForm({ users, currentUserId, onTaskCreated, onClose }: TaskFormProps) {
    // useState holds form field values
    // The generic type <string> tells TypeScript what type the state holds
    const [title, setTitle] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
    const [dueDate, setDueDate] = useState<string>('')
    const [assignedTo, setAssignedTo] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        // e.preventDefault() stops the browser from refreshing the page (default form behavior)

        if (!title.trim()) {
            setError('Task title is required')
            return  // Stop execution if validation fails
        }

        setLoading(true)
        setError('')

        try {
            const taskData: CreateTaskData = {
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                due_date: dueDate || undefined,
            }

            const newTask = await createTask(taskData)
            onTaskCreated(newTask)  // Tell parent about the new task
            onClose()               // Close the modal

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    return (
        // Modal overlay — dark background behind the form
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
                // Close modal when clicking the dark overlay (not the form itself)
                if (e.target === e.currentTarget) onClose()
            }}
        >
            {/* Modal content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Title field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            // onChange fires on every keystroke, updating state
                            placeholder="e.g. Fix login bug on mobile"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this task..."
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>

                    {/* Priority + Due Date in a row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Priority
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="low">🟢 Low</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="high">🔴 High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                // min prevents selecting past dates
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Assign to user */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assign To
                        </label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-4 py-3 border text-gray-900 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">— Unassigned —</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {/* key= is required in React lists for performance */}
                                    {user.full_name || user.email}
                                    {user.id === currentUserId ? ' (You)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* Submit buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}