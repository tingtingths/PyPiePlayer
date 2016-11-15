import base64
import hashlib
import uuid
from functools import wraps

from web import app
from flask import request, Response, after_this_request

tokens = []
token_file = "tokens"
token_loaded = False

def auth_deco(userpass_dict, cookie_auth=False):
    def deco(func):
        @wraps(func)
        def filter(*args, **kwargs):
            auth_ok = False
            auth_by = None
            headers = request.headers
            if "authorization" not in headers and "token" not in request.cookies.keys(): # no auth and no cookie
                return Response("Unauthorized access...", 401, {"WWW-Authenticate": "Basic realm=\"PiePlayer\""})

            if "token" in request.cookies.keys() and cookie_auth:
                if not token_loaded:
                    load_token()
                if request.cookies.get("token") in tokens:
                    auth_ok = True
                    auth_by = "cookie"
            if "authorization" in headers and not auth_ok:
                try:
                    auth = base64.b64decode(headers["authorization"].split(" ")[1]).decode("utf8").split(":")
                    if auth[0] in userpass_dict.keys(): # user in dict
                        auth_ok = True if _sha256(auth[1]) == userpass_dict[auth[0]] else False
                        auth_by = "header"
                except Exception as e:
                    print(e)

            if auth_ok:
                resp = func(*args, **kwargs)
                if not auth_by == "cookie" and cookie_auth:
                    @after_this_request
                    def put_cookie(response):
                        token = gen_token()
                        save_token(token)
                        response.set_cookie("token", token)
                        return response
                return resp
            else:
                return "Unauthorized access...", 401
        return filter
    return deco


def _sha256(s):
    hash = hashlib.sha256()
    hash.update(s.encode("utf8"))
    return hash.hexdigest()

def load_token():
    global tokens, token_loaded
    try:
        with open(token_file, "r") as f:
            tokens = f.read().split(",")
    except FileNotFoundError:
        open(token_file, "w").close()
    token_loaded = True

def save_token(token):
    global tokens
    with open(token_file, "a") as f:
        if len(tokens) == 0:
            f.write(token)
        else:
            f.write("," + token)
    tokens.append(token)

def gen_token():
    return uuid.uuid4().hex
