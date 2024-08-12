"""
Module for storing the cryptographic methods.

@author Ethan Andrews
@version 2024.8.12
"""

import secrets
import string
import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Key used for database encryption
database_key = base64.b64decode(os.environ['DATABASE_KEY'].encode('utf-8'))


def generate_salt(length=16):
    """
    Generate a random salt of a given length of bytes (default 16).
    :param length: length of salt in bytes.
    :return: salt
    """
    alphabet = string.ascii_letters + string.digits
    random_string = ''.join(secrets.choice(alphabet) for _ in range(length))
    return random_string


def generate_aes_key(key_size=256):
    """
    Generate an AES key with given key size.
    :param key_size: key size in bits (default 256).
    :return: an aes key
    """
    if key_size not in [128, 192, 256]:
        raise ValueError("Invalid key size. Choose 128, 192, or 256 bits.")

    # Generate a random key of the specified size
    key = os.urandom(key_size // 8)
    return key


def aes_key_to_string(key):
    """
    Converts an AES key (bytes) to a Base64-encoded string.

    :param key: AES key as bytes.
    :return: Base64-encoded string representing the AES key.
    """
    return base64.b64encode(key).decode('utf-8')


def string_to_aes_key(key_string):
    """
    Converts a Base64-encoded string back to an AES key (bytes).

    :param key_string: Base64-encoded string representing the AES key.
    :return: AES key as bytes.
    """
    return base64.b64decode(key_string)


def aes_encrypt(message, key=database_key):
    """
    Encrypts a message with AES. Default: uses the database key
    :param message: the message to be encrypted
    :param key: AES key as bytes.
    :return: the encrypted message as a string
    """
    # Generate initialization vector
    iv = os.urandom(16)

    # Create AES cipher object with key and IV
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    # Encrypt the message
    ciphertext = encryptor.update(message.encode('utf-8')) + encryptor.finalize()

    # Encode the IV and ciphertext
    iv_encoded = base64.b64encode(iv).decode('utf-8')
    ciphertext_encoded = base64.b64encode(ciphertext).decode('utf-8')

    return _encrypted_to_string(iv_encoded, ciphertext_encoded)


def aes_decrypt(encrypted_message, key=database_key):
    """
    Decrypts a message with AES. Default: uses the database key
    :param encrypted_message: the encrypted message
    :param key: the AES key as bytes.
    :return: the decrypted message
    """
    iv_encoded, ciphertext_encoded = _string_to_encrypted(encrypted_message)

    # Decode the Base64-encoded IV and ciphertext
    iv = base64.b64decode(iv_encoded)
    ciphertext = base64.b64decode(ciphertext_encoded)

    # Create AES cipher object with key and IV
    cipher = Cipher(algorithms.AES(key), modes.CFB(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    # Decrypt the ciphertext
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()

    return plaintext.decode('utf-8')


def _encrypted_to_string(iv, ciphertext):
    """
    Helper method for combining iv and ciphertext into a single string.
    :param iv: initialization vector
    :param ciphertext: the ciphertext
    :return:
    """
    return iv + ":" + ciphertext


def _string_to_encrypted(encrypted_string):
    """
    Helper method for separating the iv and ciphertext from the encrypted string.
    :param encrypted_string:
    :return:
    """
    iv, ciphertext = encrypted_string.split(":")
    return iv, ciphertext
