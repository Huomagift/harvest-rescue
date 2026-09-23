import hashlib
import hmac
import os
import secrets
from typing import Optional


def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with a 16-byte cryptographically
    secure random salt and 100,000 iterations (FIPS-compliant standard).
    Returns string in format: 'salt_hex:hash_hex'.
    """
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verifies a password against the stored 'salt_hex:hash_hex' string
    using constant-time comparison to protect against timing attacks.
    """
    try:
        parts = stored_hash.split(":")
        if len(parts) != 2:
            return False
        salt = bytes.fromhex(parts[0])
        expected_key = bytes.fromhex(parts[1])
        key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key, expected_key)
    except Exception:
        return False


def generate_auth_token() -> str:
    """
    Generates a cryptographically strong 256-bit URL-safe token.
    """
    return secrets.token_urlsafe(32)
