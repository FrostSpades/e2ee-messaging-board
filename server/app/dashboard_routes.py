"""
Routes for the dashboard behavior which involves creating pages and showing the dashboard.

@author Ethan Andrews
@version 2024.7.22
"""
from flask import Blueprint, render_template
from flask_login import login_required
from app.account_routes import check_time_since_login as main_check_time_since_login

bp = Blueprint('dashboard', __name__)


@bp.route('/dashboard')
@login_required
def dashboard():
    """
    Handles dashboard page.

    :return:
    """
    return render_template('dashboard.html', title='Dashboard')


@bp.before_request
def check_time_since_login():
    """
    Method that logs out the current user after a certain amount of time.
    :return:
    """
    main_check_time_since_login()
