"""
Models for the application.

@author Ethan Andrews
@version 2024.7.15
"""

from app import db
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin


class User(UserMixin, db.Model):
    """
    Model for the User sql table.
    """
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def __repr__(self):
        return '<User %r>' % self.username

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Post(db.Model):
    """
    Model for the user post sql table.
    """
    post_id = db.Column(db.Integer, primary_key=True)
    encrypted_title = db.Column(db.String(120), nullable=False)
    encrypted_message = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'), nullable=False)


class Page(db.Model):
    """
    Model for the page sql table.
    """
    id = db.Column(db.Integer, primary_key=True)
    encrypted_title = db.Column(db.String(120), nullable=False)
    encrypted_description = db.Column(db.Text, nullable=True)
    posts = db.relationship('Post', backref='page', lazy=True)
    users = db.relationship('User', secondary='page_user', backref='pages')


class PageUser(db.Model):
    """
    Model for the relational table relating pages and users.
    """
    __tablename__ = 'page_user'
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
