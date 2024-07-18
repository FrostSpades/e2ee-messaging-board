from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.forms import RegistrationForm, LoginForm
from flask_login import login_required
from app.account_routes import check_time_since_login as main_check_time_since_login

bp = Blueprint('board', __name__)


@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', title='Dashboard')


@bp.before_request
def check_time_since_login():
    main_check_time_since_login()
