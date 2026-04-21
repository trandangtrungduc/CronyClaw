import base64
import hashlib
import json
import time
import uuid
from pathlib import Path
from typing import Any, Optional

from nacl.signing import SigningKey

SCOPES = ["operator.admin", "operator.approvals", "operator.pairing"]
ROLE = "operator"


def _b64url_nopad(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _build_device_auth_payload(
    *,
    device_id: str,
    client_id: str,
    client_mode: str,
    role: str,
    scopes: list[str],
    signed_at_ms: int,
    token: str,
    nonce: str,
) -> str:
    return "|".join(
        [
            "v2",
            device_id,
            client_id,
            client_mode,
            role,
            ",".join(scopes),
            str(signed_at_ms),
            token or "",
            nonce,
        ]
    )


def load_or_create_device_identity(key_path: str) -> dict[str, Any]:
    path = Path(key_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        raw = path.read_bytes()
        signing_key = SigningKey(raw)
    else:
        signing_key = SigningKey.generate()
        path.write_bytes(bytes(signing_key))
    public_key_bytes = bytes(signing_key.verify_key)
    device_id = hashlib.sha256(public_key_bytes).hexdigest()
    public_key = _b64url_nopad(public_key_bytes)
    return {
        "signing_key": signing_key,
        "device_id": device_id,
        "public_key": public_key,
        "key_path": str(path.resolve()),
    }


def build_connect_params(
    *,
    client_id: str,
    client_version: str,
    platform: str,
    token: str,
    password: str,
    nonce: str,
    device_identity: dict[str, Any],
) -> dict[str, Any]:
    signed_at_ms = int(time.time() * 1000)
    payload = _build_device_auth_payload(
        device_id=device_identity["device_id"],
        client_id=client_id,
        client_mode="webchat",
        role=ROLE,
        scopes=SCOPES,
        signed_at_ms=signed_at_ms,
        token=token,
        nonce=nonce,
    )
    signature = _b64url_nopad(
        device_identity["signing_key"].sign(payload.encode("utf-8")).signature
    )
    auth: dict[str, Any] | None = None
    if token or password:
        auth = {}
        if token:
            auth["token"] = token
        if password:
            auth["password"] = password
    params: dict[str, Any] = {
        "minProtocol": 3,
        "maxProtocol": 3,
        "client": {
            "id": client_id,
            "version": client_version,
            "platform": platform,
            "mode": "webchat",
        },
        "role": ROLE,
        "scopes": SCOPES,
        "caps": [],
        "commands": [],
        "permissions": {},
        "device": {
            "id": device_identity["device_id"],
            "publicKey": device_identity["public_key"],
            "signature": signature,
            "signedAt": signed_at_ms,
            "nonce": nonce,
        },
        "userAgent": "node",
        "locale": "en-US",
    }
    if auth is not None:
        params["auth"] = auth
    return params


def new_req_id() -> str:
    return str(uuid.uuid4())


def dumps_req(method: str, params: Any, req_id: Optional[str] = None) -> tuple[str, str]:
    rid = req_id or new_req_id()
    return rid, json.dumps({"type": "req", "id": rid, "method": method, "params": params})
