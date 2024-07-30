"""
Routes for the page behavior.

@author Ethan Andrews
@version 2024.7.22
"""
from flask import Blueprint, render_template, redirect, url_for, jsonify, session, abort, request
from flask_login import login_required, current_user
from app.account_routes import check_time_since_login as main_check_time_since_login
from app.page_forms import AddUserForm, RemoveUserForm, PageCreateForm, PostCreateForm
from app.models import User, Page, PageUser, Invite, Post
from app import db
from sqlalchemy.orm import joinedload

bp = Blueprint('page', __name__)


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

    # Clear data
    session['invite_users'] = []

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

            # Get the users and public keys
            users_and_keys = get_users_public_keys(session['invite_users'])

            return jsonify({"success": True, "message": "Successfully Added User", "users": users_and_keys})
        else:
            return jsonify({"success": False, "message": "Cannot add user"})
    else:
        return jsonify({"success": False, "message": "Invalid data"})


def validate_invite(invite_username, page=None):
    """
    Helper method for determining if a user can be invited to a page. If page parameter is provided,
    checks if user can be invited to this specific page.

    :param invite_username: username of the person to be invited
    :param page: page user is to be invited to
    :return: True if user can be invited, false otherwise
    """
    invited_user = User.query.filter_by(username=invite_username).first()

    # Check if user exists
    if invited_user is None:
        return False

    # Check if invited username is equal to the current user
    if invite_username == User.query.filter_by(id=current_user.id).first().username:
        return False

    if page is not None:
        # Check if user already is in the page
        if invited_user in page.users:
            return False

        # Check if user has already been invited to the page
        if Invite.query.filter_by(user_id=invited_user.id, page_id=page.id).first() is not None:
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

            # Get the users and keys
            users_and_keys = get_users_public_keys(session['invite_users'])

            return jsonify({"success": True, "message": "Successfully Removed User", "users": users_and_keys})
        else:
            return jsonify({"success": False, "message": "Could Not Remove User"})
    else:
        return jsonify({"success": False, "message": "Invalid data"})


@bp.route('/create-page/get-keys', methods=['GET'])
@login_required
def create_page_get_keys():
    """
    Returns essential key information for page creation.
    :return: JSON object
    """
    # Get the current user
    user = User.query.filter_by(id=current_user.id).first()

    # Retrieve the invite keys
    return jsonify({"success": True, "browser_key": user.browser_encryption_key})


@bp.route('/create-page/submit', methods=['POST'])
@login_required
def create_page_submit():
    """
    Page for submitting the created page.

    :return: redirect to dashboard if successfully created, redirect to create_page if unsuccessful
    """
    page_create_form = PageCreateForm()

    if page_create_form.validate_on_submit():
        # Create the new page
        new_page = Page(encrypted_title=page_create_form.encrypted_title.data, encrypted_description=page_create_form.encrypted_description.data)
        db.session.add(new_page)
        db.session.commit()

        # Add current user to the page
        page_user_relation = PageUser(page_id=new_page.id, user_id=current_user.id, encrypted_key=page_create_form.creator_encrypted_key.data)
        db.session.add(page_user_relation)

        requested_invited_users = {}
        for user in page_create_form.encrypted_keys.data:
            requested_invited_users[user['username']] = user['key']

        # Invite users to the page if they exist in the session
        if session['invite_users']:
            # Get all the invited users
            invited_users_db = User.query.filter(User.username.in_(session['invite_users'])).all()

            # Check if the user submitted data for the invited user and add invites
            for invited_user in invited_users_db:
                if invited_user.username in requested_invited_users:
                    invite = Invite(page_id=new_page.id, user_id=invited_user.id, encrypted_key=requested_invited_users[invited_user.username])
                    db.session.add(invite)

        # Clear invited users from the session and commit
        session['invite_users'] = []
        db.session.commit()
        return redirect(url_for('page.pages'))

    return redirect(url_for('page.create_page'))


@bp.route('/create-page/init-get', methods=['GET'])
@login_required
def create_page_init_get():
    """
    Returns the objects necessary for page loading the create-page html file.
    :return: json representation of necessary page objects
    """
    # Retrieve list of usernames in the session
    invite_users = session.get('invite_users', [])

    # Retrieve the invited users' public keys
    users_and_keys = get_users_public_keys(invite_users)

    return jsonify({"users": users_and_keys})


def get_users_public_keys(users):
    # Ensure the usernames list is not empty to avoid unnecessary queries
    if not users:
        return []

    # Query the User model for users with usernames in the provided list and retrieve the keys in the same order
    users = User.query.filter(User.username.in_(users)).all()
    users_and_keys = []
    for user in users:
        users_and_keys.append({"username": user.username, "key": user.public_key})

    return users_and_keys


@bp.route('/pages/init-get', methods=['GET'])
@login_required
def pages_init_get():
    """
    Returns the objects necessary for page loading the pages html file.
    :return:
    """
    # Extract page information
    database_pages = User.query.filter_by(id=current_user.id).first().pages
    user_pages = []
    for page in database_pages:
        user_pages.append({"id": page.id, "title": page.encrypted_title})

    return jsonify({"success": True, "pages": user_pages})


@bp.route('/pages', methods=['GET'])
@login_required
def pages():
    return render_template('pages.html', title="Pages")


@bp.route('/page/<int:page_id>', methods=['GET'])
@login_required
def view_page(page_id):
    post_add_form = PostCreateForm()
    add_user_form = AddUserForm()

    # Query the Database to see if page exists
    page = Page.query.filter_by(id=page_id).first()
    if not user_has_access(page):
        abort(403)

    return render_template('page.html', page=page, post_add_form=post_add_form, add_user_form=add_user_form)


def user_has_access(page):
    """
    Checks if user can access the page.
    :param page: the page the user is trying to access
    :return: true if user can access the page, false otherwise
    """
    # Check if page exists
    if page is None:
        return False

    # Check if user has access to page
    if PageUser.query.filter_by(user_id=current_user.id, page_id=page.id).first() is None:
        return False

    return True


@bp.route('/page/<int:page_id>/init-get', methods=['GET'])
@login_required
def page_init_get(page_id):
    # Retrieve all the posts associated with the page
    database_posts = Post.query.filter_by(page_id=page_id).options(joinedload(Post.user)).all()
    posts = []
    for post in database_posts:
        posts.append({"message": post.encrypted_message, "user": post.user.username})

    return jsonify({"success": True, "posts": posts})


@bp.route('/page/<int:page_id>/add-post', methods=['POST'])
@login_required
def add_post(page_id):
    post_add_form = PostCreateForm()

    # Check if user has access to this request
    if not user_has_access(Page.query.filter_by(id=page_id).first()):
        abort(403)

    # If post submission was valid, add the post
    if post_add_form.validate_on_submit():
        new_post = Post(encrypted_message=post_add_form.encrypted_message.data, user_id=current_user.id, page_id=page_id)
        db.session.add(new_post)
        db.session.commit()

        # Retrieve all the posts associated with the page
        database_posts = Post.query.filter_by(page_id=page_id).options(joinedload(Post.user)).all()
        posts = []
        for post in database_posts:
            posts.append({"message": post.encrypted_message, "user": post.user.username})

        return jsonify({"success": True, "posts": posts})

    return jsonify({"success": False})


@bp.route('/page/<int:page_id>/invite-user', methods=['POST'])
@login_required
def existing_page_invite(page_id):
    """
    Adds a user to an existing page.

    :param page_id: id of the page
    :return: json response
    """
    add_user_form = AddUserForm()

    page = Page.query.filter_by(id=page_id).first()
    if not user_has_access(page):
        abort(403)

    # Add user to page
    if add_user_form.validate_on_submit():
        if validate_invite(add_user_form.new_user.data, page):
            invited_user = User.query.filter_by(username=add_user_form.new_user.data).first()
            invite = Invite(page_id=page_id, user_id=invited_user.id)
            db.session.add(invite)
            db.session.commit()

            return jsonify({"success": True})

    return jsonify({"success": False})


@bp.route('/pages/invites', methods=['GET'])
@login_required
def page_invites():
    return render_template('page_invites.html')


@bp.route('/pages/invites/init-get', methods=['GET'])
@login_required
def page_invites_init_get():
    user_invites = get_invites()

    return jsonify({"success": True, "invites": user_invites})


def get_invites():
    """
    Helper method for getting the user's invites
    :return: user's invites
    """
    database_invites = Invite.query.filter_by(user_id=current_user.id)
    user_invites = []
    for invite in database_invites:
        user_invites.append({"id": invite.id, "title": invite.page.encrypted_title})

    return user_invites


@bp.route("/pages/accept-invite/<int:invite_id>", methods=['POST'])
@login_required
def page_accept_invite(invite_id):
    invite = Invite.query.filter_by(id=invite_id).first()

    # Check if user has access
    if not user_has_invite(invite):
        return jsonify({"success": False})

    # Add user to page and remove invite
    new_page_user = PageUser(user_id=invite.user_id, page_id=invite.page_id)
    db.session.add(new_page_user)
    db.session.delete(invite)
    db.session.commit()

    user_invites = get_invites()
    return jsonify({"success": True, "invites": user_invites})


@bp.route("/pages/decline-invite/<int:invite_id>", methods=['POST'])
@login_required
def page_decline_invite(invite_id):
    invite = Invite.query.filter_by(id=invite_id).first()

    # Check if user has access
    if not user_has_invite(invite):
        return jsonify({"success": False})

    # Remove invite
    db.session.delete(invite)
    db.session.commit()

    user_invites = get_invites()
    return jsonify({"success": True, "invites": user_invites})


def user_has_invite(invite):
    """
    Check if the invite belongs to the user
    :param invite: the invite
    :return: true if invite belongs, false otherwise
    """
    if invite is None:
        return False

    if current_user.id != invite.user_id:
        return False

    return True


@bp.before_request
def check_time_since_login():
    """
    Method that logs out the current user after a certain amount of time.
    :return:
    """
    main_check_time_since_login()
