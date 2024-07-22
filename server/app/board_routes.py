"""
Routes for the dashboard behavior which involves creating pages and showing the dashboard.

@author Ethan Andrews
@version 2024.7.22
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash, jsonify, session
from flask_login import login_required
from app.account_routes import check_time_since_login as main_check_time_since_login
from app.forms import AddUserForm
from app.models import User

bp = Blueprint('board', __name__)


@bp.route('/dashboard')
@login_required
def dashboard():
    """
    Handles dashboard page.

    :return:
    """
    return render_template('dashboard.html', title='Dashboard')


@bp.route('/create-page', methods=['GET', 'POST'])
@login_required
def create_page():
    """
    Handles page creation.
    :return:
    """
    add_user_form = AddUserForm()

    return render_template('create_page.html', title='Create Page', add_user_form=add_user_form)


@bp.route('/create-page/add-user', methods=['POST'])
def add_user():
    """
    Handles inviting users for page through AJAX request.
    :return: json object
    """
    add_user_form = AddUserForm()
    if add_user_form.validate_on_submit():
        # If user exists, add it to the list of invites
        if User.query.filter_by(username=add_user_form.username.data).first() is not None:
            # Initialize session if not already initialized
            if "invite_users" not in session:
                session['invite_users'] = []

            # Add user to the invite user list
            if add_user_form.username.data not in session['invite_users']:
                session['invite_users'].append(add_user_form.username.data)

            session.update()
            return jsonify({"success": True, "message": "Successfully Added User", "invite_users": session['invite_users']})
        else:
            return jsonify({"success": False, "message": "Cannot add user", "invite_users": session['invite_users']})
    else:
        return jsonify({"success": False, "message": "Invalid data", "invite_users": session['invite_users']})


@bp.route('/create-page/init-get', methods=['GET'])
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
