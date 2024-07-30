import secrets
import string
import os
import base64


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
