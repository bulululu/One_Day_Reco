"""Password hashing and signed bearer tokens."""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional


TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30


def _secret() -> str:
    return os.getenv("AUTH_SECRET", "onedayreco-dev-secret-change-me")


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"pbkdf2_sha256${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_b64, digest_b64 = stored_hash.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = _b64_decode(salt_b64)
        expected = _b64_decode(digest_b64)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return hmac.compare_digest(actual, expected)
    except Exception:
        return False


def create_token(user_id: str) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {"sub": user_id, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    signing_input = f"{_b64(json.dumps(header, separators=(',', ':')).encode())}.{_b64(json.dumps(payload, separators=(',', ':')).encode())}"
    signature = hmac.new(_secret().encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{_b64(signature)}"


def verify_token(token: str) -> Optional[str]:
    try:
        header_b64, payload_b64, signature_b64 = token.split(".", 2)
        signing_input = f"{header_b64}.{payload_b64}"
        expected = hmac.new(_secret().encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64(expected), signature_b64):
            return None
        payload = json.loads(_b64_decode(payload_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload.get("sub")
    except Exception:
        return None
