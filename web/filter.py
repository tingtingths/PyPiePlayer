from simplewebframework.framework.filter import RequestFilter
import base64
from log import wlog

class WebFilter(RequestFilter):

	def __init__(self, user, passwd):
		self.user = user
		self.passwd = passwd

	def filter(self, req):
		auth_ok = False
		headers = req.headers
		
		if "Authorization" not in headers:
			return False, 401, "Unauthorized access...", [("WWW-Authenticate", "Basic realm=\"REALM\"")]
		else:
			try:
				auth = base64.b64decode(headers["Authorization"].split(" ")[1]).decode("utf8").split(":")
				auth_ok = True if auth[0] == self.user and auth[1] == self.passwd else False
			except Exception as e:
				wlog("EXCEPTION...")
				wlog(e)
		if auth_ok:
			return auth_ok, 200, "", []
		else:
			return auth_ok, 401, "Unauthorized access...", []
