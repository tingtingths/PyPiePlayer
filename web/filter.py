import base64
import hashlib
from functools import wraps

from web import app
from flask import request, Response

def auth_deco(user, passhash):
    def deco(func):
        @wraps(func)
        def filter(*args, **kwargs):
            auth_ok = None
            headers = request.headers
            if "authorization" not in headers:
                return Response("Unauthorized access...", 401, {"WWW-Authenticate": "Basic realm=\"PiePlayer\""})
            else:
                try:
                    auth = base64.b64decode(headers["authorization"].split(" ")[1]).decode("utf8").split(":")
                    auth_ok = True if auth[0] == user and _sha256(auth[1]) == passhash else False
                except Exception as e:
                    print(e)
            if auth_ok:
                return func(*args, **kwargs)
            else:
                return "Unauthorized access...", 401
        return filter
    return deco


def _sha256(s):
    hash = hashlib.sha256()
    hash.update(s.encode("utf8"))
    return hash.hexdigest()

"""auth_ok = False
headers = req.headers
if "authorization" not in headers:
    return False, 401, "Unauthorized access...", [("WWW-Authenticate", "Basic realm=\"PiePlayer\"")]
else:
    try:
        auth = base64.b64decode(headers["authorization"].split(" ")[1]).decode("utf8").split(":")
        auth_ok = True if auth[0] == user and _sha256(auth[1]) == passhash else False
    except Exception as e:
        wlog("EXCEPTION...")
        wlog(e)
if auth_ok:
    return auth_ok, 200, "", []
else:
    return auth_ok, 401, "Unauthorized access...", []
"""
