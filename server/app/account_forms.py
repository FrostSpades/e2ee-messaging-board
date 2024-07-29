"""
Forms for the account aspect of the application.

@author Ethan Andrews
@version 2024.7.14
"""
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError


class RegistrationForm(FlaskForm):
    """
    Form for registering a new user.
    """
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    public_key = StringField('Public Key', validators=[DataRequired()])
    encrypted_private_key = StringField('Encrypted Private Key', validators=[DataRequired()])
    aes_salt = StringField('AES Salt', validators=[DataRequired(), Length(min=16, max=16)])

    def validate_username(self, username):
        if username.data == 'admin':
            raise ValidationError('Invalid username')


class LoginForm(FlaskForm):
    """
    Form for logging in.
    """
    email = StringField('Email', validators=[DataRequired(), Email()])
    hashed_password = PasswordField('Hashed Password', validators=[DataRequired()])
