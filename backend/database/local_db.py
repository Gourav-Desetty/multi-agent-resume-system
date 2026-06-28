import json
import os
import threading
from typing import List, Dict, Any, Optional
import hashlib
from backend.config import settings, logger

class SHA256Hasher:
    def hash(self, secret: str) -> str:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', secret.encode('utf-8'), salt, 100000)
        return salt.hex() + "$" + key.hex()

    def verify(self, secret: str, hashed: str) -> bool:
        try:
            salt_hex, key_hex = hashed.split("$")
            salt = bytes.fromhex(salt_hex)
            key = bytes.fromhex(key_hex)
            new_key = hashlib.pbkdf2_hmac('sha256', secret.encode('utf-8'), salt, 100000)
            return new_key == key
        except Exception:
            return False

pwd_context = SHA256Hasher()

class LocalDB:
    def __init__(self):
        self.filepath = settings.DATABASE_FILE
        self._lock = threading.Lock()
        self.data: Dict[str, Any] = {
            "users": {},
            "candidates": {},
            "job_descriptions": {}
        }
        self._load()
        self._seed_default_users()

    def _load(self):
        with self._lock:
            if os.path.exists(self.filepath):
                try:
                    with open(self.filepath, "r", encoding="utf-8") as f:
                        self.data = json.load(f)
                        # Ensure keys exist
                        if "users" not in self.data:
                            self.data["users"] = {}
                        if "candidates" not in self.data:
                            self.data["candidates"] = {}
                        if "job_descriptions" not in self.data:
                            self.data["job_descriptions"] = {}
                except Exception as e:
                    logger.error(f"Error loading local database: {e}")

    def _save(self):
        with self._lock:
            try:
                os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
                with open(self.filepath, "w", encoding="utf-8") as f:
                    json.dump(self.data, f, indent=4, default=str)
            except Exception as e:
                logger.error(f"Error saving local database: {e}")

    def _seed_default_users(self):
        # We preseed default users: admin, hr, reviewer
        default_users = {
            "admin": {
                "username": "admin",
                "password": "admin123",
                "role": "Admin"
            },
            "hr": {
                "username": "hr",
                "password": "hr123",
                "role": "HR"
            },
            "reviewer": {
                "username": "reviewer",
                "password": "reviewer123",
                "role": "Reviewer"
            }
        }
        modified = False
        for username, user_info in default_users.items():
            if username not in self.data["users"]:
                self.data["users"][username] = {
                    "username": username,
                    "hashed_password": pwd_context.hash(user_info["password"]),
                    "role": user_info["role"]
                }
                modified = True
            elif not pwd_context.verify(user_info["password"], self.data["users"][username].get("hashed_password", "")):
                self.data["users"][username]["hashed_password"] = pwd_context.hash(user_info["password"])
                self.data["users"][username]["role"] = user_info["role"]
                modified = True
        if modified:
            self._save()

    # User APIs
    def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        return self.data["users"].get(username)

    def create_user(self, username: str, password_raw: str, role: str) -> Dict[str, Any]:
        user_info = {
            "username": username,
            "hashed_password": pwd_context.hash(password_raw),
            "role": role
        }
        self.data["users"][username] = user_info
        self._save()
        return user_info

    # Candidate APIs
    def get_candidate(self, cid: str) -> Optional[Dict[str, Any]]:
        return self.data["candidates"].get(cid)

    def get_all_candidates(self) -> List[Dict[str, Any]]:
        return list(self.data["candidates"].values())

    def save_candidate(self, candidate_data: Dict[str, Any]):
        cid = candidate_data["id"]
        self.data["candidates"][cid] = candidate_data
        self._save()

    def delete_candidate(self, cid: str) -> bool:
        if cid in self.data["candidates"]:
            del self.data["candidates"][cid]
            self._save()
            return True
        return False

    # Job Description APIs
    def get_jd(self, jid: str) -> Optional[Dict[str, Any]]:
        return self.data["job_descriptions"].get(jid)

    def get_all_jds(self) -> List[Dict[str, Any]]:
        return list(self.data["job_descriptions"].values())

    def save_jd(self, jd_data: Dict[str, Any]):
        jid = jd_data["id"]
        self.data["job_descriptions"][jid] = jd_data
        self._save()

    def delete_jd(self, jid: str) -> bool:
        if jid in self.data["job_descriptions"]:
            del self.data["job_descriptions"][jid]
            # Clean candidate linkages if any
            for cid, cand in self.data["candidates"].items():
                if cand.get("active_job_id") == jid:
                    cand["active_job_id"] = None
            self._save()
            return True
        return False

db = LocalDB()
