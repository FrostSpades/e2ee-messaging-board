"""
Initialization "factory" for the website application.

@author Ethan Andrews
@version 2024.7.14
"""
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect

bcrypt = Bcrypt()
login_manager = LoginManager()
db = SQLAlchemy()
csrf = CSRFProtect()


def create_app():
    """
    Returns an instance of the application.

    :return: application
    """

    app = Flask(__name__)
    app.config.from_object('config.Config')
    app.config.from_pyfile('config.py', silent=True)

    # Import all the routes from the blueprints
    from . import home_routes
    app.register_blueprint(home_routes.bp)
    from . import account_routes
    app.register_blueprint(account_routes.bp)
    from . import dashboard_routes
    app.register_blueprint(dashboard_routes.bp)
    from . import page_routes
    app.register_blueprint(page_routes.bp)

    login_manager.login_view = 'account.login'

    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)

    return app
