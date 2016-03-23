import re

from simplewebframework.framework.filter import RequestFilter


class HelloFilter(RequestFilter):
    def filter(self, req):  # req - (clientAddress, headers, method, path, query)
        result = True, 200, "", []

        if re.match("^/restricted_area(/|$)", req.path):
            result = False, 403, "This is restricted area.", []

        return result
