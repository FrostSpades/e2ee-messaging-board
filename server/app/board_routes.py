from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.forms import RegistrationForm, LoginForm
from flask_login import login_required

bp = Blueprint('board', __name__)


@bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', title='Dashboard')