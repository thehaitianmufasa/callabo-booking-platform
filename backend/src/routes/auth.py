"""
Authentication API endpoints for the LangGraph Multi-Agent Platform.

This module provides Flask-based API endpoints for user authentication
including login, logout, callback, and user information.
"""

from flask import Blueprint, request, jsonify, redirect, session, g, url_for
from urllib.parse import urlencode
import os
from typing import Dict, Any

from auth.logto_config import get_logto_client
from auth.decorators import authenticated, optional_auth
from auth.organizations import get_organization_manager


# Create Blueprint for auth routes
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')


@auth_bp.route('/login', methods=['GET'])
def login():
    """
    Initiate the login flow.
    
    Query parameters:
        redirect_uri: Where to redirect after successful login (optional)
        organization_id: Pre-select organization context (optional)
    
    Returns:
        Redirect to Logto login page
    """
    client = get_logto_client()
    
    # Get redirect URI from query param or use default
    redirect_uri = request.args.get('redirect_uri', '/')
    
    # Store in session for use after callback
    session['post_login_redirect'] = redirect_uri
    
    # Get optional organization hint
    org_id = request.args.get('organization_id')
    if org_id:
        session['requested_organization'] = org_id
    
    # Generate authorization URL
    callback_url = url_for('auth.callback', _external=True)
    auth_url = client.get_authorization_url(
        redirect_uri=callback_url,
        scope='openid profile email offline_access',
        resource=os.environ.get('LOGTO_RESOURCE_INDICATOR'),
        prompt='login'
    )
    
    return redirect(auth_url)


@auth_bp.route('/callback', methods=['GET'])
def callback():
    """
    Handle the OAuth callback from Logto.
    
    This endpoint is called by Logto after successful authentication.
    It exchanges the authorization code for tokens and creates a session.
    
    Returns:
        Redirect to the originally requested page or dashboard
    """
    client = get_logto_client()
    
    try:
        # Get authorization code
        code = request.args.get('code')
        if not code:
            return jsonify({'error': 'Missing authorization code'}), 400
        
        # Exchange code for tokens
        callback_url = url_for('auth.callback', _external=True)
        token_response = client.exchange_token_by_authorization_code(
            code=code,
            redirect_uri=callback_url
        )
        
        # Store tokens in session
        session['access_token'] = token_response['access_token']
        session['id_token'] = token_response['id_token']
        if 'refresh_token' in token_response:
            session['refresh_token'] = token_response['refresh_token']
        
        # Fetch user info
        user_info = client.fetch_user_info(token_response['access_token'])
        session['user'] = user_info
        
        # Check if user needs to be added to requested organization
        org_manager = get_organization_manager()
        requested_org = session.pop('requested_organization', None)
        
        if requested_org:
            # Check if user is already a member
            member = org_manager.get_member(requested_org, user_info['sub'])
            if not member:
                # Check for pending invitation
                # In a real implementation, you'd match by email
                pass
        
        # Get redirect URL from session
        redirect_url = session.pop('post_login_redirect', '/')
        
        # For API-based flows, return JSON response
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': True,
                'user': user_info,
                'redirect_url': redirect_url
            })
        
        # For web flows, redirect
        return redirect(redirect_url)
        
    except Exception as e:
        # Log error (in production, use proper logging)
        print(f"OAuth callback error: {str(e)}")
        
        if request.headers.get('Accept') == 'application/json':
            return jsonify({'error': 'Authentication failed'}), 500
        
        # Redirect to login with error
        return redirect(url_for('auth.login', error='auth_failed'))


@auth_bp.route('/logout', methods=['POST'])
@authenticated
def logout():
    """
    Log out the current user.
    
    This endpoint clears the session and optionally redirects to Logto logout.
    
    JSON payload (optional):
        redirect_uri: Where to redirect after logout
        
    Returns:
        Success response or redirect to Logto logout
    """
    client = get_logto_client()
    
    # Get redirect URI
    if request.is_json:
        redirect_uri = request.json.get('redirect_uri', '/')
    else:
        redirect_uri = request.args.get('redirect_uri', '/')
    
    # Clear session
    id_token = session.get('id_token')
    session.clear()
    
    # Generate Logto logout URL
    if id_token:
        logout_url = client.get_logout_url(
            id_token=id_token,
            post_logout_redirect_uri=redirect_uri
        )
        
        if request.is_json:
            return jsonify({
                'success': True,
                'logout_url': logout_url
            })
        
        return redirect(logout_url)
    
    # If no ID token, just return success
    return jsonify({'success': True})


@auth_bp.route('/me', methods=['GET'])
@authenticated
def get_current_user():
    """
    Get current user information.
    
    Returns:
        JSON with user details and organization memberships
    """
    org_manager = get_organization_manager()
    
    # Get user organizations
    user_orgs = org_manager.get_user_organizations(g.user_id)
    
    # Format organization data
    organizations = []
    for org, role in user_orgs:
        organizations.append({
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'role': role.value,
            'description': org.description
        })
    
    # Get current organization context
    current_org = None
    if hasattr(g, 'organization_id'):
        org = org_manager.get_organization(g.organization_id)
        if org:
            current_org = {
                'id': org.id,
                'name': org.name,
                'slug': org.slug,
                'role': g.organization_role
            }
    
    return jsonify({
        'id': g.user_id,
        'email': g.user_email,
        'organizations': organizations,
        'current_organization': current_org,
        'roles': g.user_roles
    })


@auth_bp.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh the access token using the refresh token.
    
    Returns:
        New access token
    """
    client = get_logto_client()
    
    # Get refresh token from session
    refresh_token = session.get('refresh_token')
    if not refresh_token:
        return jsonify({'error': 'No refresh token available'}), 401
    
    try:
        # Exchange refresh token for new tokens
        token_response = client.exchange_token_by_refresh_token(refresh_token)
        
        # Update session
        session['access_token'] = token_response['access_token']
        if 'refresh_token' in token_response:
            session['refresh_token'] = token_response['refresh_token']
        
        return jsonify({
            'success': True,
            'access_token': token_response['access_token']
        })
        
    except Exception as e:
        print(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Failed to refresh token'}), 500


@auth_bp.route('/switch-organization', methods=['POST'])
@authenticated
def switch_organization():
    """
    Switch the user's active organization context.
    
    JSON payload:
        organization_id: ID of organization to switch to
        
    Returns:
        Updated user context
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    org_id = request.json.get('organization_id')
    if not org_id:
        return jsonify({'error': 'organization_id is required'}), 400
    
    org_manager = get_organization_manager()
    
    # Verify user has access to this organization
    context = org_manager.switch_organization_context(g.user_id, org_id)
    if not context:
        return jsonify({'error': 'Access denied to organization'}), 403
    
    # Update session with new organization context
    session['current_organization'] = org_id
    
    return jsonify({
        'success': True,
        'organization': context
    })


@auth_bp.route('/accept-invitation', methods=['POST'])
@optional_auth
def accept_invitation():
    """
    Accept an organization invitation.
    
    Can be called with or without authentication.
    If not authenticated, will redirect to login first.
    
    JSON payload:
        token: Invitation token
        
    Returns:
        Success response or redirect to login
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    token = request.json.get('token')
    if not token:
        return jsonify({'error': 'Invitation token is required'}), 400
    
    org_manager = get_organization_manager()
    
    # Check if invitation exists
    invitation = org_manager.get_invitation_by_token(token)
    if not invitation:
        return jsonify({'error': 'Invalid or expired invitation'}), 404
    
    # If user is not authenticated, redirect to login
    if not hasattr(g, 'user_id'):
        # Store invitation token for processing after login
        session['pending_invitation'] = token
        
        # Return login URL
        login_url = url_for('auth.login', _external=True)
        return jsonify({
            'authenticated': False,
            'login_url': login_url,
            'message': 'Please log in to accept the invitation'
        })
    
    # Accept invitation
    member = org_manager.accept_invitation(token, g.user_id)
    if not member:
        return jsonify({'error': 'Failed to accept invitation'}), 500
    
    # Get organization details
    org = org_manager.get_organization(invitation.organization_id)
    
    return jsonify({
        'success': True,
        'organization': {
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'role': member.role.value
        }
    })


@auth_bp.route('/check-invitation', methods=['GET'])
def check_invitation():
    """
    Check if user has a pending invitation after login.
    
    This is called after successful login to process any pending invitations.
    
    Returns:
        Invitation details if pending, null otherwise
    """
    pending_token = session.get('pending_invitation')
    if not pending_token:
        return jsonify({'pending': False})
    
    org_manager = get_organization_manager()
    invitation = org_manager.get_invitation_by_token(pending_token)
    
    if not invitation:
        # Clear invalid token
        session.pop('pending_invitation', None)
        return jsonify({'pending': False})
    
    # Get organization details
    org = org_manager.get_organization(invitation.organization_id)
    
    return jsonify({
        'pending': True,
        'invitation': {
            'token': pending_token,
            'organization': {
                'id': org.id,
                'name': org.name,
                'slug': org.slug
            },
            'role': invitation.role.value,
            'email': invitation.email
        }
    })


# Error handlers
@auth_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access."""
    return jsonify({'error': 'Unauthorized'}), 401


@auth_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access."""
    return jsonify({'error': 'Forbidden'}), 403


@auth_bp.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    return jsonify({'error': 'Internal server error'}), 500