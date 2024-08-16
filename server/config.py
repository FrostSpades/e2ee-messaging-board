"""
Config file for the server. Loads data from an encrypted file.

@author Ethan Andrews
@version 2024.8.12
"""

import os
import json
import getpass
from app.crypto import aes_decrypt


def _decrypt_config():
    """
    Decrypts the config file and returns the data.
    :return: a dictionary containing the decrypted data.
    """
    # Retrieve the encryption key
    encryption_key = getpass.getpass("Please enter generated encryption key (The key you were asked to remember): ")

    # Decrypt the data
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'app', 'secrets', 'env.json.enc')

    with open(file_path, 'r') as file:
        encrypted_data = file.read()

    try:
        decrypted_data = aes_decrypt(encrypted_data, encryption_key).replace('\'', '\"')
        config_data = json.loads(decrypted_data)
    except json.JSONDecodeError:
        print("Error: Incorrect encryption key")
        exit(1)
    except UnicodeDecodeError:
        print("Error: Incorrect encryption key")
        exit(1)

    return config_data

# Decrypt and extract the data
_config_data = _decrypt_config()
database_key = _config_data['database_key']


class Config:
    SECRET_KEY = _config_data['secret_key']
    SQLALCHEMY_DATABASE_URI = _config_data['mysql_uri']
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_PERMANENT = False
