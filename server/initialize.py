"""
File used to set up the server for first time use.

@author Ethan Andrews
@version 2024.8.12
"""

from app import db, create_app
import app.models
import os
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
import base64
from app.crypto import aes_encrypt
import re


def _setup_cli():
    """
    Handles the command line interface for setting up the server.
    :return:
    """
    print("Begin setup process")
    print("Generating secret key")
    secret_key = base64.b64encode(os.urandom(32)).decode("utf-8")

    print("Retrieving sql data")
    mysql_uri = _get_sql_data()

    print("Creating database key")
    database_key = base64.b64encode(os.urandom(32)).decode("utf-8")

    print("\n"*3)
    print("""
    Generating the encryption key.
    WARNING: This key will be used for encrypting the sensitive data generated thus far.
    You will need to enter this key every time the server is started.
    Please take note of this key. You will be asked for this key in the next step.
    
    """)

    encryption_key = base64.b64encode(os.urandom(32)).decode("utf-8")
    print(f"Encryption key: {encryption_key}")
    input("Press enter to continue")

    # Encrypt the sensitive data and save to env.json.enc
    print("\n"*3)
    print("Encrypting data")
    env_json = str({"secret_key": secret_key, "mysql_uri": mysql_uri, "database_key": database_key})
    env_json_enc = aes_encrypt(env_json, encryption_key)

    with open(os.path.abspath(__file__) + '/../app/secrets/env.json.enc', 'w') as file:
        file.write(env_json_enc)

    print("Setup successful")


def _get_sql_data():
    """
    Retrieves the user's mysql data from the command line interface and tests the connection.
    :return: the mysql uri
    """
    username = _sanitize_user_input(input("Please enter your mysql username: "))
    password = _sanitize_user_input(input("Please enter your mysql password: "))
    host = _sanitize_user_input(input("Please enter the host of your mysql server: "))
    port = _sanitize_user_input(input("Please enter the port of your mysql server: "))
    database = _sanitize_user_input(input("Please enter the database name: "))

    uri = f"mysql://{username}:{password}@{host}:{port}/{database}"

    try:
        engine = create_engine(uri)
        connection = engine.connect()
        print("MySQL Connection successful!")
        connection.close()

    except OperationalError as e:
        print(f"Connection failed: {e}")
        print("Installation failed. Please try again.")
        exit(1)

    return uri


def _sanitize_user_input(user_input):
    """
    Sanitizes user input, and alerts console if sanitization was necessary.
    :param user_input: the raw input
    :return: the sanitized input
    """
    allowed_characters = re.compile(r'[^a-zA-Z0-9!@#$%^&*()_+=-]')

    # Remove any character not in the allowed set
    sanitized_input = allowed_characters.sub('', user_input)

    if sanitized_input != user_input:
        print("\033[91mWarning: Sanitization was required on your input. This may have unintended effects.\033[0m")

    return sanitized_input


if __name__ == '__main__':
    # Retrieve the settings from the user
    _setup_cli()

    # Create the database tables
    app = create_app()
    with app.app_context():
        db.create_all()
