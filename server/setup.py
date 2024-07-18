"""
File used to set up the server for first time use.

@author Ethan Andrews
@version 2024.7.13
"""

from app import db, create_app
import app.models

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()