import base64
import hashlib
from log import wlog
from simplewebframework.framework.filter import RequestFilter


class WebFilter(RequestFilter):
    def __init__(self, user, passhash):
        self.user = user
        self.passhash = passhash

    def filter(self, req):
        auth_ok = False
        headers = req.headers

        if "Authorization" not in headers:
            return False, 401, "Unauthorized access...", [("WWW-Authenticate", "Basic realm=\"PiePlayer\"")]
        else:
            try:
                auth = base64.b64decode(headers["Authorization"].split(" ")[1]).decode("utf8").split(":")
                auth_ok = True if auth[0] == self.user and self.sha256(auth[1]) == self.passhash else False
            except Exception as e:
                wlog("EXCEPTION...")
                wlog(e)
        if auth_ok:
            return auth_ok, 200, "", []
        else:
            return auth_ok, 401, "Unauthorized access...", []

    def sha256(self, s):
        hash = hashlib.sha256()
        hash.update(s.encode("utf8"))
        return hash.hexdigest()
