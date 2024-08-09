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
    Model for the User SQL table.
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    public_key = db.Column(db.Text, nullable=False)
    encrypted_private_key = db.Column(db.Text, nullable=False)
    aes_salt = db.Column(db.String(16), nullable=False)
    browser_encryption_key = db.Column(db.Text, nullable=False)
    posts = db.relationship('Post', backref='user', lazy=True)
    invites = db.relationship('Invite', backref='user', lazy=True)
    user_access = db.relationship('UserAccess', back_populates='user', lazy=True, overlaps="pages,users")
    pages = db.relationship('Page', secondary='user_access', back_populates='users', overlaps="user_access")

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
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    encrypted_message = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'), nullable=False)


class Page(db.Model):
    """
    Model for the page sql table.
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    encrypted_title = db.Column(db.String(128), nullable=False)
    encrypted_description = db.Column(db.Text, nullable=False)
    posts = db.relationship('Post', backref='page', lazy=True)
    invites = db.relationship('Invite', backref='page', lazy=True)
    user_access = db.relationship('UserAccess', back_populates='page', lazy=True, overlaps="users")
    users = db.relationship('User', secondary='user_access', back_populates='pages', overlaps="user_access")


class UserAccess(db.Model):
    """
    Model that signifies which user has access to which page which includes the user's encrypted key to access the page.
    """
    __tablename__ = 'user_access'
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    encrypted_key = db.Column(db.Text)
    user = db.relationship('User', back_populates='user_access', overlaps="pages, users")
    page = db.relationship('Page', back_populates='user_access', overlaps="users, pages")


class Invite(db.Model):
    """
    Model for storing page invitations
    """
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    page_id = db.Column(db.Integer, db.ForeignKey('page.id'), nullable=False)
    encrypted_key = db.Column(db.Text, nullable=False)
