"""
Routes for the dashboard behavior which involves creating pages and showing the dashboard.

@author Ethan Andrews
@version 2024.7.22
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_required, current_user
from app.account_routes import check_time_since_login as main_check_time_since_login
from app.board_forms import AddUserForm, RemoveUserForm, PageCreateForm
from app.models import User, Page, PageUser, Invite
from app import db

bp = Blueprint('board', __name__)


@bp.route('/dashboard')
@login_required
def dashboard():
    """
    Handles dashboard page.

    :return:
    """
    return render_template('dashboard.html', title='Dashboard')


@bp.route('/create-page', methods=['GET'])
@login_required
def create_page():
    """
    Handles page creation.
    :return:
    """
    # Create forms
    add_user_form = AddUserForm()
    remove_user_form = RemoveUserForm()
    page_create_form = PageCreateForm()

    return render_template('create_page.html', title='Create Page', add_user_form=add_user_form, remove_user_form=remove_user_form, page_create_form=page_create_form)


@bp.route('/create-page/add-user', methods=['POST'])
@login_required
def add_user():
    """
    Handles inviting users for page through AJAX request.
    :return: json object
    """
    add_user_form = AddUserForm()
    if add_user_form.validate_on_submit():
        # Check if user can be invited
        if validate_invite(add_user_form.new_user.data):
            # Initialize session if not already initialized
            if "invite_users" not in session:
                session['invite_users'] = []

            # Add user to the invite user list
            if add_user_form.new_user.data not in session['invite_users']:
                session['invite_users'].append(add_user_form.new_user.data)

            session.update()
            return jsonify({"success": True, "message": "Successfully Added User", "invite_users": session['invite_users']})
        else:
            return jsonify({"success": False, "message": "Cannot add user", "invite_users": session['invite_users']})
    else:
        return jsonify({"success": False, "message": "Invalid data", "invite_users": session['invite_users']})


def validate_invite(invite_username):
    """
    Helper method for determining if a user can be invited to a page.

    :param invite_username: username of the person to be invited
    :return: True if user can be invited, false otherwise
    """
    # Check if user exists
    if User.query.filter_by(username=invite_username).first() is None:
        return False

    # Check if invited username is equal to the current user
    if invite_username == User.query.filter_by(id=current_user.id).first().username:
        return False

    return True


@bp.route('/create-page/remove-user', methods=['POST'])
@login_required
def remove_user():
    """
    Handles removing users for page through AJAX request.
    :return: json object
    """
    remove_user_form = RemoveUserForm()
    if remove_user_form.validate_on_submit():
        # Remove user if it exists in the user's session
        if "invite_users" in session and remove_user_form.remove_user.data in session['invite_users']:
            session['invite_users'].remove(remove_user_form.remove_user.data)
            session.update()
            return jsonify({"success": True, "message": "Successfully Removed User", "invite_users": session['invite_users']})
        else:
            return jsonify({"success": False, "message": "Could Not Remove User", "invite_users": session['invite_users']})
    else:
        return jsonify({"success": False, "message": "Invalid data", "invite_users": session['invite_users']})


@bp.route('/create-page/submit', methods=['POST'])
@login_required
def create_page_submit():
    page_create_form = PageCreateForm()

    if page_create_form.validate_on_submit():
        # Create the new page
        new_page = Page(encrypted_title=page_create_form.encrypted_title.data, encrypted_description=page_create_form.encrypted_description.data)
        db.session.add(new_page)
        db.session.commit()

        # Add current user to the page
        page_user_relation = PageUser(page_id=new_page.id, user_id=current_user.id)
        db.session.add(page_user_relation)

        # Invite users to the page
        for invited_username in session['invite_users']:
            invited_user = User.query.filter_by(username=invited_username).first()
            invite = Invite(page_id=new_page.id, user_id=invited_user.id)
            db.session.add(invite)

        session['invite_users'] = []
        db.session.commit()
        return redirect(url_for('board.dashboard'))

    return redirect(url_for('board.create_page'))


@bp.route('/create-page/init-get', methods=['GET'])
@login_required
def init_get():
    """
    Returns the objects necessary for page loading.
    :return: json representation of necessary page objects
    """
    # Assuming 'invite_users' is a list of usernames in the session
    invite_users = session.get('invite_users', [])
    return jsonify({"invite_users": invite_users})


@bp.before_request
def check_time_since_login():
    """
    Method that logs out the current user after a certain amount of time.
    :return:
    """
    main_check_time_since_login()
