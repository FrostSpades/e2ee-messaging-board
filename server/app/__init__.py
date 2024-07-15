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

    app = Flask(__name__)
    app.config.from_object('config.Config')
    app.config.from_pyfile('config.py', silent=True)

    db.init_app(app)


    from . import account_routes
    app.register_blueprint(account_routes.bp)

    return app