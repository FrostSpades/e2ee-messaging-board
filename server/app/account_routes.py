"""
Routes related to account information and login.

@author Ethan Andrews
@version 2024.7.14
"""
from flask import Blueprint, render_template, session, redirect, url_for, flash, request
from app.forms import RegistrationForm, LoginForm
from app.models import User
from app import db
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin

bp = Blueprint('main', __name__)


@bp.route('/', methods=['GET', 'POST'])
def home():
    return render_template('base.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()

    if form.validate_on_submit():

        return redirect(url_for('main.home'))

    return render_template('login.html', title='Login', form=form)


@bp.route('/register', methods=['GET', 'POST'])
def register():
    form = RegistrationForm()

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
    # Clear session data
    session.clear()

    return redirect(url_for('main.home'))


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