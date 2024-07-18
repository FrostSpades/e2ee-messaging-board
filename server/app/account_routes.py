"""
Routes related to account information and login.

@author Ethan Andrews
@version 2024.7.14
"""
from flask import Blueprint, render_template, session, redirect, url_for, flash
from app.forms import RegistrationForm, LoginForm
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
        flash(f'Account created for {form.username.data}!', 'success')
        return redirect(url_for('main.login'))

    return render_template('register.html', title='Register', form=form)


@bp.route('/logout')
def logout():
    # Clear session data
    session.clear()

    return redirect(url_for('main.home'))
