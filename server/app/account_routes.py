"""
Routes related to account information and login.

@author Ethan Andrews
@version 2024.8.12
"""
from flask import Blueprint, render_template, session, redirect, url_for, flash, request, jsonify
from app.account_forms import RegistrationForm, LoginForm
from app.models import User
from app import db, login_manager
from flask_login import login_user, logout_user, current_user
import time
from app.crypto import generate_salt, generate_aes_key, aes_key_to_string, aes_encrypt
import hashlib
from config import database_key

bp = Blueprint('account', __name__)


@bp.route('/', methods=['GET'])
def home():
    """
    Shows the home page.

    :return: the home page
    """
    return render_template('base.html')


@bp.route('/login', methods=['GET'])
def login():
    """
    Handles login page.

    :return: dashboard if successful, or login page if unsuccessful
    """
    form = LoginForm()

    # If user is already logged in, redirect to dashboard
    if current_user.is_authenticated:
        return redirect(url_for('page.pages'))

    return render_template('login.html', title='Login', form=form)


@bp.route('/login/submit', methods=['POST'])
def login_submit():
    """
    Handles the submission of a login form. Logs the user in if successful.
    :return:
    """
    form = LoginForm()

    if form.validate_on_submit():
        email_hash = hashlib.sha256(request.form['email'].encode('utf-8')).hexdigest()

        if _check_credentials(email_hash, request.form['hashed_password']):
            # Log the user into the website
            user = User.query.filter_by(email_hash=email_hash).first()
            login_user(user)
            session['last_login_time'] = time.time()

            return jsonify({"success": True, "current_username": user.username, "aes_key": user.browser_encryption_key, "aes_salt": user.aes_salt})

        else:
            flash('Invalid username or password', 'error')

    else:
        flash('Invalid username or password', 'error')

    return jsonify({"success": False, "flash": True})


@bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    Handles user registration page.
    :return: login form if successful, register form if unsuccessful
    """
    form = RegistrationForm()

    if request.method == 'POST':
        if form.validate_on_submit():
            encrypted_email = aes_encrypt(request.form['email'], database_key)
            email_hash = hashlib.sha256(request.form['email'].encode('utf-8')).hexdigest()

            # If user does not exist, create user
            if not _user_exists(request.form['username'], email_hash):
                _create_user(form.username.data, encrypted_email, email_hash, form.password.data, form.public_key.data,
                            form.encrypted_private_key.data, form.aes_salt.data)

                return redirect(url_for('account.login'))

            else:
                flash("Username/Email already registered", "error")
                return redirect(url_for('account.register'))

        else:
            # Flash only a single error
            errors = form.errors
            if 'username' in errors:
                flash("Invalid username", "error")
            elif 'email' in errors:
                flash("Invalid email", "error")
            elif 'password' in errors:
                flash("Invalid password", "error")
            elif 'confirm_password' in errors:
                flash("Confirm Password must match password", "error")

            return redirect(url_for('account.register'))

    # Show register form if GET request
    else:
        # If user is already logged in, redirect to dashboard
        if current_user.is_authenticated:
            return redirect(url_for('page.pages'))

        return render_template('register.html', title='Register', form=form, salt=generate_salt())


@bp.route('/logout', methods=['GET', 'POST'])
def logout():
    """
    Logs the user out.
    :return: redirect to home page
    """
    # Logout the user
    logout_user()

    return redirect(url_for('home.home'))


@login_manager.user_loader
def load_user(user_id):
    """
    Loads a user with a given user_id.
    :param user_id:
    :return:
    """
    return User.query.get(int(user_id))


def _user_exists(username, email_hash):
    """
    Checks if a user exists in the database.
    :param username: the user's username
    :param email_hash: the user's hashed email
    :return: true if exists, false otherwise
    """

    existing_username = User.query.filter_by(username=username).first()
    existing_email = User.query.filter_by(email_hash=email_hash).first()

    return existing_username is not None or existing_email is not None


def _check_credentials(email_hash, password):
    """
    Checks if these are valid credentials for a user.
    :param email_hash: user's hashed email
    :param password: user's password
    :return: True if the credentials are valid, False otherwise
    """
    user = User.query.filter_by(email_hash=email_hash).first()
    if user is None:
        return False

    return user.check_password(password)


def _create_user(username, encrypted_email, email_hash, password, public_key, encrypted_private_key, aes_salt):
    """
    Creates a new user in the database.

    :param username: user's username
    :param encrypted_email: user's encrypted email
    :param email_hash: user's hashed email
    :param password: user's password
    :param public_key: user's public key
    :param encrypted_private_key: user's encrypted private key
    :param aes_salt: user's AES salt
    :return: void
    """
    new_user = User(username=username, encrypted_email=encrypted_email, email_hash=email_hash, public_key=public_key, encrypted_private_key=encrypted_private_key, aes_salt=aes_salt, browser_encryption_key=aes_key_to_string(generate_aes_key()))
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()


@bp.before_request
def check_time_since_login():
    """
    Method that logs out the current user after a certain amount of time.
    :return:
    """
    if current_user.is_authenticated:
        if time.time() - session['last_login_time'] > 600:
            logout_user()
