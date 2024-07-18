from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.forms import RegistrationForm, LoginForm

bp = Blueprint('board', __name__)


@bp.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', title='Dashboard')