"""
Routes related to the homepage.

@author Ethan Andrews
@version 2024.8.12
"""
from flask import Blueprint, render_template

bp = Blueprint('home', __name__)


@bp.route('/', methods=['GET'])
def home():
    """
    Shows the home page.

    :return: the home page
    """
    return render_template('base.html')
