"""
Organization management API endpoints for the LangGraph Multi-Agent Platform.

This module provides Flask-based API endpoints for organization management
including creating organizations, managing members, and handling invitations.
"""

from flask import Blueprint, request, jsonify, g
from typing import Dict, Any, List
import re

from auth.decorators import authenticated, organization_required, role_required
from auth.organizations import (
    get_organization_manager, 
    OrganizationRole,
    Organization
)


# Create Blueprint for organization routes
organizations_bp = Blueprint('organizations', __name__, url_prefix='/organizations')


@organizations_bp.route('', methods=['GET'])
@authenticated
def list_organizations():
    """
    List all organizations the current user belongs to.
    
    Returns:
        JSON array of organizations with user's role in each
    """
    org_manager = get_organization_manager()
    user_orgs = org_manager.get_user_organizations(g.user_id)
    
    organizations = []
    for org, role in user_orgs:
        organizations.append({
            'id': org.id,
            'name': org.name,
            'slug': org.slug,
            'description': org.description,
            'role': role.value,
            'created_at': org.created_at.isoformat() if org.created_at else None,
            'updated_at': org.updated_at.isoformat() if org.updated_at else None
        })
    
    return jsonify({
        'organizations': organizations,
        'total': len(organizations)
    })


@organizations_bp.route('', methods=['POST'])
@authenticated
def create_organization():
    """
    Create a new organization.
    
    JSON payload:
        name: Organization name (required)
        slug: URL-friendly identifier (optional, auto-generated if not provided)
        description: Organization description (optional)
        metadata: Additional metadata (optional)
        
    Returns:
        Created organization details
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    data = request.json
    name = data.get('name')
    
    if not name:
        return jsonify({'error': 'Organization name is required'}), 400
    
    # Validate slug if provided
    slug = data.get('slug')
    if slug:
        if not re.match(r'^[a-z0-9-]+$', slug):
            return jsonify({'error': 'Slug must contain only lowercase letters, numbers, and hyphens'}), 400
    
    org_manager = get_organization_manager()
    
    # Create organization
    org = org_manager.create_organization(
        name=name,
        created_by=g.user_id,
        slug=slug,
        description=data.get('description'),
        metadata=data.get('metadata')
    )
    
    return jsonify({
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'description': org.description,
        'created_at': org.created_at.isoformat() if org.created_at else None,
        'role': OrganizationRole.ADMIN.value  # Creator is always admin
    }), 201


@organizations_bp.route('/<org_id>', methods=['GET'])
@authenticated
@organization_required
def get_organization(org_id: str):
    """
    Get organization details.
    
    Returns:
        Organization details if user has access
    """
    org_manager = get_organization_manager()
    org = org_manager.get_organization(org_id)
    
    if not org:
        return jsonify({'error': 'Organization not found'}), 404
    
    # Check if user has access
    member = org_manager.get_member(org_id, g.user_id)
    if not member:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'description': org.description,
        'created_at': org.created_at.isoformat() if org.created_at else None,
        'updated_at': org.updated_at.isoformat() if org.updated_at else None,
        'metadata': org.metadata,
        'role': member.role.value
    })


@organizations_bp.route('/<org_id>', methods=['PATCH'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value)
def update_organization(org_id: str):
    """
    Update organization details.
    
    Requires admin role in the organization.
    
    JSON payload:
        name: New organization name (optional)
        description: New description (optional)
        metadata: New metadata (optional)
        
    Returns:
        Updated organization details
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    org_manager = get_organization_manager()
    
    # Update organization
    org = org_manager.update_organization(
        org_id,
        name=request.json.get('name'),
        description=request.json.get('description'),
        metadata=request.json.get('metadata')
    )
    
    if not org:
        return jsonify({'error': 'Organization not found'}), 404
    
    return jsonify({
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'description': org.description,
        'updated_at': org.updated_at.isoformat() if org.updated_at else None
    })


@organizations_bp.route('/<org_id>', methods=['DELETE'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value)
def delete_organization(org_id: str):
    """
    Delete an organization.
    
    Requires admin role in the organization.
    This will remove all members and associated data.
    
    Returns:
        Success response
    """
    org_manager = get_organization_manager()
    
    if not org_manager.delete_organization(org_id):
        return jsonify({'error': 'Organization not found'}), 404
    
    return jsonify({'success': True, 'message': 'Organization deleted'})


@organizations_bp.route('/<org_id>/members', methods=['GET'])
@authenticated
@organization_required
def list_organization_members(org_id: str):
    """
    List all members of an organization.
    
    Returns:
        JSON array of organization members
    """
    org_manager = get_organization_manager()
    members = org_manager.get_organization_members(org_id)
    
    member_list = []
    for member in members:
        member_list.append({
            'user_id': member.user_id,
            'role': member.role.value,
            'joined_at': member.joined_at.isoformat(),
            'invited_by': member.invited_by
        })
    
    return jsonify({
        'members': member_list,
        'total': len(member_list)
    })


@organizations_bp.route('/<org_id>/members/<user_id>', methods=['PATCH'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value)
def update_member_role(org_id: str, user_id: str):
    """
    Update a member's role in the organization.
    
    Requires admin role.
    
    JSON payload:
        role: New role (admin, editor, viewer)
        
    Returns:
        Updated member details
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    new_role_str = request.json.get('role')
    if not new_role_str:
        return jsonify({'error': 'Role is required'}), 400
    
    # Validate role
    try:
        new_role = OrganizationRole(new_role_str)
    except ValueError:
        return jsonify({'error': f'Invalid role. Must be one of: {", ".join([r.value for r in OrganizationRole])}'}), 400
    
    org_manager = get_organization_manager()
    
    # Prevent users from changing their own role
    if user_id == g.user_id:
        return jsonify({'error': 'Cannot change your own role'}), 400
    
    # Update role
    if not org_manager.update_member_role(org_id, user_id, new_role):
        return jsonify({'error': 'Member not found'}), 404
    
    return jsonify({
        'user_id': user_id,
        'role': new_role.value,
        'updated': True
    })


@organizations_bp.route('/<org_id>/members/<user_id>', methods=['DELETE'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value)
def remove_member(org_id: str, user_id: str):
    """
    Remove a member from the organization.
    
    Requires admin role.
    
    Returns:
        Success response
    """
    org_manager = get_organization_manager()
    
    # Prevent users from removing themselves
    if user_id == g.user_id:
        return jsonify({'error': 'Cannot remove yourself from organization'}), 400
    
    # Check if this would leave org without admins
    members = org_manager.get_organization_members(org_id)
    admin_count = sum(1 for m in members if m.role == OrganizationRole.ADMIN)
    removing_member = org_manager.get_member(org_id, user_id)
    
    if removing_member and removing_member.role == OrganizationRole.ADMIN and admin_count <= 1:
        return jsonify({'error': 'Cannot remove last admin from organization'}), 400
    
    # Remove member
    if not org_manager.remove_member(org_id, user_id):
        return jsonify({'error': 'Member not found'}), 404
    
    return jsonify({'success': True, 'message': 'Member removed'})


@organizations_bp.route('/<org_id>/invitations', methods=['GET'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value, OrganizationRole.EDITOR.value)
def list_invitations(org_id: str):
    """
    List pending invitations for the organization.
    
    Requires admin or editor role.
    
    Query parameters:
        include_expired: Include expired invitations (default: false)
        
    Returns:
        JSON array of invitations
    """
    include_expired = request.args.get('include_expired', 'false').lower() == 'true'
    
    org_manager = get_organization_manager()
    invitations = org_manager.get_organization_invitations(org_id, include_expired)
    
    invitation_list = []
    for inv in invitations:
        invitation_list.append({
            'id': inv.id,
            'email': inv.email,
            'role': inv.role.value,
            'expires_at': inv.expires_at.isoformat(),
            'created_by': inv.created_by,
            'created_at': inv.created_at.isoformat(),
            'accepted': inv.accepted_at is not None,
            'expired': inv.expires_at < inv.created_at  # This should check against current time
        })
    
    return jsonify({
        'invitations': invitation_list,
        'total': len(invitation_list)
    })


@organizations_bp.route('/<org_id>/invitations', methods=['POST'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value, OrganizationRole.EDITOR.value)
def create_invitation(org_id: str):
    """
    Create an invitation to join the organization.
    
    Requires admin or editor role.
    
    JSON payload:
        email: Email address to invite (required)
        role: Role to assign (required)
        expires_in_hours: Hours until expiration (optional, default 72)
        
    Returns:
        Created invitation details
    """
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 400
    
    data = request.json
    email = data.get('email')
    role_str = data.get('role')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    if not role_str:
        return jsonify({'error': 'Role is required'}), 400
    
    # Validate email format
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate role
    try:
        role = OrganizationRole(role_str)
    except ValueError:
        return jsonify({'error': f'Invalid role. Must be one of: {", ".join([r.value for r in OrganizationRole])}'}), 400
    
    # Editors can only invite viewers
    if g.organization_role == OrganizationRole.EDITOR.value and role != OrganizationRole.VIEWER:
        return jsonify({'error': 'Editors can only invite viewers'}), 403
    
    org_manager = get_organization_manager()
    
    # Create invitation
    invitation = org_manager.create_invitation(
        org_id=org_id,
        email=email,
        role=role,
        created_by=g.user_id,
        expires_in_hours=data.get('expires_in_hours', 72)
    )
    
    if not invitation:
        return jsonify({'error': 'Failed to create invitation'}), 500
    
    # In production, send invitation email here
    invitation_url = f"{request.host_url}auth/accept-invitation?token={invitation.token}"
    
    return jsonify({
        'id': invitation.id,
        'email': invitation.email,
        'role': invitation.role.value,
        'expires_at': invitation.expires_at.isoformat(),
        'invitation_url': invitation_url
    }), 201


@organizations_bp.route('/<org_id>/invitations/<invitation_id>', methods=['DELETE'])
@authenticated
@organization_required
@role_required(OrganizationRole.ADMIN.value)
def revoke_invitation(org_id: str, invitation_id: str):
    """
    Revoke an invitation.
    
    Requires admin role.
    
    Returns:
        Success response
    """
    org_manager = get_organization_manager()
    
    # Verify invitation belongs to this organization
    invitations = org_manager.get_organization_invitations(org_id, include_expired=True)
    invitation_ids = [inv.id for inv in invitations]
    
    if invitation_id not in invitation_ids:
        return jsonify({'error': 'Invitation not found'}), 404
    
    # Revoke invitation
    if not org_manager.revoke_invitation(invitation_id):
        return jsonify({'error': 'Failed to revoke invitation'}), 500
    
    return jsonify({'success': True, 'message': 'Invitation revoked'})


@organizations_bp.route('/<org_id>/leave', methods=['POST'])
@authenticated
@organization_required
def leave_organization(org_id: str):
    """
    Leave an organization.
    
    Users cannot leave if they are the last admin.
    
    Returns:
        Success response
    """
    org_manager = get_organization_manager()
    
    # Check if user is last admin
    members = org_manager.get_organization_members(org_id)
    admin_count = sum(1 for m in members if m.role == OrganizationRole.ADMIN)
    current_member = org_manager.get_member(org_id, g.user_id)
    
    if current_member and current_member.role == OrganizationRole.ADMIN and admin_count <= 1:
        return jsonify({'error': 'Cannot leave organization as the last admin'}), 400
    
    # Remove member
    if not org_manager.remove_member(org_id, g.user_id):
        return jsonify({'error': 'Failed to leave organization'}), 500
    
    return jsonify({'success': True, 'message': 'Successfully left organization'})


# Error handlers
@organizations_bp.errorhandler(400)
def bad_request(error):
    """Handle bad request errors."""
    return jsonify({'error': 'Bad request'}), 400


@organizations_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access."""
    return jsonify({'error': 'Forbidden'}), 403


@organizations_bp.errorhandler(404)
def not_found(error):
    """Handle not found errors."""
    return jsonify({'error': 'Not found'}), 404