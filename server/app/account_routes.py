from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.forms import RegistrationForm, LoginForm

bp = Blueprint('main', __name__)


@bp.route('/', methods=['GET', 'POST'])
def home():
    return render_template('base.html')


@bp.route('/login', methods=['GET', 'POST'])
def login():
    print("LOGIN CLICKED")
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
