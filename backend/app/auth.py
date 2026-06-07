# auth.py — Handles Google OAuth login flow

from flask import Blueprint, redirect, request, jsonify, session
import os
import requests
from app.db import get_supabase

auth_bp = Blueprint('auth', __name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


@auth_bp.route('/google')
def google_login():
    params = {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'redirect_uri': f"{os.environ.get('BACKEND_URL', 'http://localhost:5000')}/api/auth/google/callback",
        'response_type': 'code',
        'scope': 'openid email profile',
        'access_type': 'offline',
        'prompt': 'select_account'
    }
    query_string = '&'.join([f"{k}={v}" for k, v in params.items()])
    return redirect(f"{GOOGLE_AUTH_URL}?{query_string}")


@auth_bp.route('/google/callback')
def google_callback():
    code = request.args.get('code')

    if not code:
        return redirect(f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login?error=cancelled")

    # Exchange code for tokens
    token_response = requests.post(GOOGLE_TOKEN_URL, data={
        'code': code,
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'redirect_uri': f"{os.environ.get('BACKEND_URL', 'http://localhost:5000')}/api/auth/google/callback",
        'grant_type': 'authorization_code'
    })

    token_data = token_response.json()
    print("Token data received:", token_data.keys())  # Debug log

    access_token = token_data.get('access_token')
    id_token = token_data.get('id_token')

    if not access_token:
        return redirect(f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login?error=token_failed")

    # Get user info from Google
    user_response = requests.get(
        GOOGLE_USERINFO_URL,
        headers={'Authorization': f'Bearer {access_token}'}
    )
    user_info = user_response.json()
    print("User info:", user_info.get('email'))  # Debug log

    try:
        supabase = get_supabase()

        # Try signing in with Supabase using the Google ID token
        auth_response = supabase.auth.sign_in_with_id_token({
            'provider': 'google',
            'token': id_token,
        })

        supabase_session = auth_response.session

        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return redirect(f"{frontend_url}/dashboard?token={supabase_session.access_token}")

    except Exception as e:
        print(f"Supabase auth error: {e}")  # This will show exact error in terminal
        return redirect(f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login?error=auth_failed")


@auth_bp.route('/me')
def get_current_user():
    auth_header = request.headers.get('Authorization', '')

    if not auth_header.startswith('Bearer '):
        return jsonify({'error': 'No token provided'}), 401

    token = auth_header.split(' ')[1]

    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(token)

        profile = supabase.table('profiles')\
            .select('*')\
            .eq('id', user.user.id)\
            .single()\
            .execute()

        return jsonify(profile.data), 200

    except Exception as e:
        return jsonify({'error': 'Invalid token'}), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200