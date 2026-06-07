# tasks.py — All task-related API routes

from flask import Blueprint, request, jsonify
from app.db import get_supabase  # ← import the FUNCTION, not the object
from app.email_service import send_task_assigned_email, send_task_completed_email
import functools

tasks_bp = Blueprint('tasks', __name__)


def require_auth(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authentication required'}), 401

        token = auth_header.split(' ')[1]

        try:
            supabase = get_supabase()  # ← create fresh client
            user_response = supabase.auth.get_user(token)
            request.current_user = user_response.user
            request.auth_token = token
        except Exception:
            return jsonify({'error': 'Invalid or expired token'}), 401

        return f(*args, **kwargs)

    return decorated_function


@tasks_bp.route('/', methods=['GET'])
@require_auth
def get_tasks():
    supabase = get_supabase()  # ← fresh client in every route
    user_id = request.current_user.id

    query = supabase.table('tasks').select(
        '*, created_by_profile:profiles!tasks_created_by_fkey(id, full_name, email, avatar_url), '
        'assigned_to_profile:profiles!tasks_assigned_to_fkey(id, full_name, email, avatar_url)'
    )

    status_filter = request.args.get('status')
    if status_filter:
        query = query.eq('status', status_filter)

    assigned_filter = request.args.get('assigned_to_me')
    if assigned_filter == 'true':
        query = query.eq('assigned_to', user_id)

    result = query.order('created_at', desc=True).execute()
    return jsonify(result.data), 200


@tasks_bp.route('/', methods=['POST'])
@require_auth
def create_task():
    supabase = get_supabase()
    data = request.get_json()

    if not data or not data.get('title'):
        return jsonify({'error': 'Task title is required'}), 400

    user_id = request.current_user.id

    new_task = {
        'title': data['title'],
        'description': data.get('description', ''),
        'status': 'pending',
        'priority': data.get('priority', 'medium'),
        'due_date': data.get('due_date'),
        'created_by': user_id,
        'assigned_to': data.get('assigned_to')
    }

    result = supabase.table('tasks').insert(new_task).execute()
    created_task = result.data[0]

    if created_task.get('assigned_to'):
        try:
            assignee = supabase.table('profiles')\
                .select('email, full_name')\
                .eq('id', created_task['assigned_to'])\
                .single()\
                .execute()

            creator = supabase.table('profiles')\
                .select('full_name')\
                .eq('id', user_id)\
                .single()\
                .execute()

            if assignee.data and creator.data:
                send_task_assigned_email(
                    assignee_email=assignee.data['email'],
                    assignee_name=assignee.data.get('full_name', 'User'),
                    task_title=created_task['title'],
                    assigned_by=creator.data.get('full_name', 'Someone'),
                    task_description=created_task.get('description', '')
                )
        except Exception as e:
            print(f"Failed to send assignment email: {e}")

    return jsonify(created_task), 201


@tasks_bp.route('/<task_id>', methods=['PUT'])
@require_auth
def update_task(task_id):
    supabase = get_supabase()
    data = request.get_json()
    user_id = request.current_user.id

    existing = supabase.table('tasks')\
        .select('*')\
        .eq('id', task_id)\
        .single()\
        .execute()

    if not existing.data:
        return jsonify({'error': 'Task not found'}), 404

    task = existing.data

    if task['created_by'] != user_id and task['assigned_to'] != user_id:
        return jsonify({'error': 'You do not have permission to update this task'}), 403

    update_data = {}
    allowed_fields = ['title', 'description', 'status', 'priority', 'due_date', 'assigned_to']

    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    if not update_data:
        return jsonify({'error': 'No valid fields to update'}), 400

    result = supabase.table('tasks')\
        .update(update_data)\
        .eq('id', task_id)\
        .execute()

    updated_task = result.data[0]

    old_status = task['status']
    new_status = update_data.get('status')

    if old_status != 'completed' and new_status == 'completed':
        try:
            creator = supabase.table('profiles')\
                .select('email, full_name')\
                .eq('id', task['created_by'])\
                .single()\
                .execute()

            completer = supabase.table('profiles')\
                .select('full_name')\
                .eq('id', user_id)\
                .single()\
                .execute()

            if creator.data and completer.data:
                send_task_completed_email(
                    creator_email=creator.data['email'],
                    creator_name=creator.data.get('full_name', 'User'),
                    task_title=task['title'],
                    completed_by=completer.data.get('full_name', 'Someone')
                )
        except Exception as e:
            print(f"Failed to send completion email: {e}")

    return jsonify(updated_task), 200


@tasks_bp.route('/<task_id>', methods=['DELETE'])
@require_auth
def delete_task(task_id):
    supabase = get_supabase()
    user_id = request.current_user.id

    existing = supabase.table('tasks')\
        .select('created_by')\
        .eq('id', task_id)\
        .single()\
        .execute()

    if not existing.data:
        return jsonify({'error': 'Task not found'}), 404

    if existing.data['created_by'] != user_id:
        return jsonify({'error': 'Only the task creator can delete it'}), 403

    supabase.table('tasks').delete().eq('id', task_id).execute()
    return jsonify({'message': 'Task deleted successfully'}), 200


@tasks_bp.route('/users', methods=['GET'])
@require_auth
def get_users():
    supabase = get_supabase()
    result = supabase.table('profiles')\
        .select('id, full_name, email, avatar_url')\
        .execute()

    return jsonify(result.data), 200