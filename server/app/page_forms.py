"""
Forms for the pages part of the application.

@author Ethan Andrews
@version 2024.7.14
"""
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError


class AddUserForm(FlaskForm):
    """
    Form for inviting a user to a page.
    """
    new_user = StringField('NewUsername', validators=[DataRequired(), Length(min=2, max=20)])


class RemoveUserForm(FlaskForm):
    """
    Form for removing a user invite from a page.
    """
    remove_user = StringField('RemoveUsername', validators=[DataRequired(), Length(min=2, max=20)])


class PageCreateForm(FlaskForm):
    encrypted_title = StringField('EncryptedTitle', validators=[DataRequired(), Length(max=128)])
    encrypted_description = StringField('EncryptedDescription', validators=[DataRequired(), Length(max=512)])