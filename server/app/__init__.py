"""
Initialization "factory" for the website application.

@author Ethan Andrews
@version 2024.7.14
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager

bcrypt = Bcrypt()
login_manager = LoginManager()
db = SQLAlchemy()


def create_app():
    """
    Returns an instance of the application.

    :return: application
    """

    app = Flask(__name__)
    app.config.from_object('config.Config')
    app.config.from_pyfile('config.py', silent=True)

    from . import account_routes
    app.register_blueprint(account_routes.bp)
    from . import board_routes
    app.register_blueprint(board_routes.bp)

    login_manager.login_view = 'main.login'

    db.init_app(app)
    login_manager.init_app(app)

    return app
