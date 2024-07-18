"""
Routes related to account information and login.

@author Ethan Andrews
@version 2024.7.14
"""
from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from app.forms import RegistrationForm, LoginForm
from app.models import User
from app import db, login_manager
from flask_login import login_user, logout_user, login_required, current_user

bp = Blueprint('main', __name__)


@bp.route('/', methods=['GET', 'POST'])
def home():
    return render_template('base.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()

    if current_user.is_authenticated:
        return redirect(url_for('board.dashboard'))

    if form.validate_on_submit():
        if check_credentials(request.form['email'], request.form['password']):
            user = User.query.filter_by(email=request.form['email']).first()
            login_user(user)
            return redirect(url_for('board.dashboard'))

        else:
            flash('Invalid username or password', 'error')
            return redirect(url_for('main.login'))

    return render_template('login.html', title='Login', form=form)


@bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()

    if current_user.is_authenticated:
        return redirect(url_for('board.dashboard'))

    if form.validate_on_submit():
        # If user does not exist, create user
        if not user_exists(request.form['username'], request.form['email']):
            create_user(request.form['username'], request.form['email'], request.form['password'])

            return redirect(url_for('main.login'))

        else:
            flash("Username/Email already registered", "error")
            return redirect(url_for('main.register'))

    return render_template('register.html', title='Register', form=form)


@bp.route('/logout')
def logout():
    # Logout the user
    logout_user()

    return redirect(url_for('main.home'))


@login_manager.user_loader
def load_user(user_id):
    """
    Loads a user with a given user_id.
    :param user_id:
    :return:
    """
    return User.query.get(int(user_id))


def user_exists(username, email):
    """
    Checks if a user exists in the database.
    :param username: the user's username
    :param email: the user's email
    :return: true if exists, false otherwise
    """

    existing_username = User.query.filter_by(username=username).first()
    existing_email = User.query.filter_by(email=email).first()
    return existing_username is not None or existing_email is not None


def check_credentials(email, password):
    """
    Checks if these are valid credentials for a user.
    :param email: user's email
    :param password: user's password
    :return: True if the credentials are valid, False otherwise
    """

    user = User.query.filter_by(email=email).first()
    if user is None:
        return False

    return user.check_password(password)


def create_user(username, email, password):
    """
    Creates a new user in the database.

    :param username: user's username
    :param email: user's email
    :param password: user's password
    :return: void
    """
    new_user = User(username=username, email=email)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()