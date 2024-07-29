import secrets
import string


def generate_salt(length=16):
    """
    Generate a random salt of a given length of bytes (default 16).
    :param length: length of salt in bytes.
    :return: salt
    """
    alphabet = string.ascii_letters + string.digits
    random_string = ''.join(secrets.choice(alphabet) for _ in range(length))
    return random_string
