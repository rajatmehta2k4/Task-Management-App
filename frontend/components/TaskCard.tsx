'use client'

import { Task, updateTask, deleteTask } from '@/lib/api'
import { FaRegCalendarAlt } from 'react-icons/fa'
import { MdDeleteForever } from 'react-icons/md'
// '@/' is an alias for the root of the project (configured in next.config.ts)

// Define the props (parameters) this component accepts
interface TaskCardProps {
    task: Task
    currentUserId: string
    onUpdate: (updatedTask: Task) => void  // Callback function when task is updated
    onDelete: (taskId: string) => void     // Callback when task is deleted
}

export default function TaskCard({ task, currentUserId, onUpdate, onDelete }: TaskCardProps) {
    // Status color mapping — visual indicator for task status
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        in_progress: 'bg-blue-100 text-blue-800 border border-blue-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
    }

    const priorityColors = {
        low: 'bg-green-100 text-green-600',
        medium: 'bg-orange-100 text-orange-700',
        high: 'bg-red-100 text-red-700',
    }

    // Check if current user is creator or assignee (determines what they can do)
    const isCreator = task.created_by === currentUserId
    const isAssignee = task.assigned_to === currentUserId
    const canEdit = isCreator || isAssignee

    async function handleStatusChange(newStatus: Task['status']) {
        try {
            await updateTask(task.id, { status: newStatus })
            onUpdate({ ...task, status: newStatus })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to update task status'
            alert(message)
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this task?')) return
        try {
            await deleteTask(task.id)
            onDelete(task.id)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete task'
            alert(message)
        }
    }

    // Format date for display: "2024-12-31" → "Dec 31, 2024"
    function formatDate(dateString: string | null): string {
        if (!dateString) return 'No due date'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        })
    }

    return (
        <div className={`bg-white rounded-xl border-2 p-5 shadow-sm hover:shadow-md transition-shadow ${task.status === 'completed' ? 'border-green-200 opacity-75' : task.status === 'pending' ? 'border-yellow-200' : task.status === 'in_progress' ? 'border-blue-200' : 'border-gray-100'
            }`}>
            {/* Task header: title + status badge */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className={`font-semibold text-gray-900 text-lg leading-tight flex-1 ${task.status === 'completed' ? 'line-through text-gray-400' : ''
                    }`}>
                    {task.title}
                </h3>

                <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${statusColors[task.status]}`}>
                    {task.status.replace('_', ' ')}  {/* "in_progress" → "in progress" */}
                </span>
            </div>

            {/* Description */}
            {task.description && (
                <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                    {task.description}
                    {/* line-clamp-2 = truncates to 2 lines with "..." */}
                </p>
            )}

            {/* Meta info row */}
            <div className="flex flex-wrap gap-2 mb-4">
                {/* Priority badge */}
                <span className={`text-xs px-2 py-1 rounded-md font-medium ${priorityColors[task.priority]}`}>
                    {task.priority} priority
                </span>

                {/* Due date */}
                <span className="text-xs text-gray-600 flex items-center gap-1">
                    <FaRegCalendarAlt />
                    {formatDate(task.due_date)}
                </span>
            </div>

            {/* Assigned to / Created by */}
            <div className="text-xs text-gray-400 mb-4 space-y-1">
                <div>Created by: <span className="font-medium text-gray-600">
                    {task.created_by_profile?.full_name || 'Unknown'}
                </span></div>

                {task.assigned_to_profile && (
                    <div>Assigned to: <span className="font-medium text-gray-600">
                        {task.assigned_to_profile.full_name}
                    </span></div>
                )}
            </div>

            {/* Action buttons (only shown to creator/assignee) */}
            {canEdit && task.status !== 'completed' && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {task.status === 'pending' && (
                        <button
                            onClick={() => handleStatusChange('in_progress')}
                            className="flex-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 rounded-lg transition-colors"
                        >
                            Start →
                        </button>
                    )}

                    {(task.status === 'pending' || task.status === 'in_progress') && (
                        <button
                            onClick={() => handleStatusChange('completed')}
                            className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 font-medium py-2 rounded-lg transition-colors"
                        >
                            ✓ Complete
                        </button>
                    )}

                    {isCreator && (
                        <button
                            onClick={handleDelete}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-3 rounded-lg transition-colors"
                        >
                            <MdDeleteForever size={20} />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}