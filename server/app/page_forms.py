"""
Forms for the pages part of the application.

@author Ethan Andrews
@version 2024.8.12
"""
from flask_wtf import FlaskForm
from wtforms import StringField, FieldList, FormField
from wtforms.validators import DataRequired, Length


class UserForm(FlaskForm):
    """
    Form for submitting a user's username.
    """
    new_user = StringField('New Username', validators=[DataRequired(), Length(min=2, max=20)])


class InviteUserForm(FlaskForm):
    """
    Form for inviting a user to a page.
    """
    new_user = StringField('New Username', validators=[DataRequired(), Length(min=2, max=20)])
    encrypted_key = StringField('Key', validators=[DataRequired()])


class RemoveUserForm(FlaskForm):
    """
    Form for removing a user invite from a page.
    """
    remove_user = StringField('Remove Username', validators=[DataRequired(), Length(min=2, max=20)])


class KeyForm(FlaskForm):
    """
    Form for linking usernames and keys
    """
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=20)])
    key = StringField('Key', validators=[DataRequired()])


class PageCreateForm(FlaskForm):
    """
    Form for creating a page.
    """
    encrypted_title = StringField('Encrypted Title', validators=[DataRequired(), Length(max=128)])
    encrypted_description = StringField('Encrypted Description', validators=[DataRequired(), Length(max=512)])
    creator_encrypted_key = StringField('Key', validators=[DataRequired()])
    encrypted_keys = FieldList(FormField(KeyForm))


class PostCreateForm(FlaskForm):
    """
    Form for creating a post.
    """
    encrypted_message = StringField('Encrypted Message', validators=[DataRequired(), Length(max=2048)])


class AcceptInviteForm(FlaskForm):
    """
    Form for accepting an invitation to a page.
    """
    encrypted_key = StringField('Key', validators=[DataRequired()])


class DeletePageForm(FlaskForm):
    """
    Form for deleting a page with a given page id.
    """
    page_id = StringField('Page ID', validators=[DataRequired()])
