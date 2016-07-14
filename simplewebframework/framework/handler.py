import re
import os
import io
import mimetypes
from http.server import *
from urllib.parse import urlparse, unquote


def buildHandler(filter, workers, webRoot):
    class RequestHandler(BaseHTTPRequestHandler):

        code = 200

        def __init__(self, *args, **kwargs):
            super(RequestHandler, self).__init__(*args, **kwargs)

        def do_GET(self):
            self.path = unquote(self.path)
            path = self.get_path(self.path)
            query = self.get_query(self.path)
            headers = self.get_header_attributes(self.headers)
            reqContext = RequestContext(self.client_address, headers, self.command, path, query)

            filterResult = self.filter(filter, reqContext)

            if filterResult[0]: # positive result
                # map with resource in webDir
                mapped = False
                if webRoot != None and os.path.exists(webRoot + os.path.sep + path):
                    mapped = True
                    self.send_path(webRoot + path)

                if not mapped:  # resource not found, try worker
                    # look for corresponding worker
                    worker = self.get_worker(path, workers)
                    if worker:
                        result = worker.do_GET(webRoot, reqContext)  # result - tuple (code, body)
                        self.reply(result)
                    else:  # worker not found
                        print("404")
                        self.send_error(404)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
            else:
                self.reply((filterResult[1], filterResult[2], filterResult[3]))

        def do_POST(self):
            path = self.get_path(self.path)
            query = self.get_query(self.path)
            headers = self.get_header_attributes(self.headers)
            reqContext = RequestContext(self.client_address, headers, self.command, path, query)

            filterResult = self.filter(filter, reqContext)

            if filterResult[0]:
                worker = self.get_worker(path, workers)
                if worker:
                    result = worker.do_POST(webRoot, reqContext)  # result - tuple (code, body)
                    self.reply(result)
                else:
                    self.send_error(404)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
            else:
                self.reply((filterResult[1], filterResult[2], filterResult[3]))

        def detect_mime(self, path):
            return mimetypes.guess_type(path)[0]

        def send_path(self, path):  # send a file or index directory
            if os.path.isfile(path) and os.path.exists(path):
                size = os.path.getsize(path)
                headers = [("Content-type", self.detect_mime(path)), ("Content-Length", str(size))]
                # header
                self.send_response(200)
                for header in headers:
                    self.send_header(header[0], header[1])
                self.end_headers()
                # data
                with open(path, "rb", buffering=0) as f:
                    while True:
                        chunk = f.read(4096)
                        if len(chunk) == 0:
                            break
                        self.wfile.write(chunk)
                # no reply() call needed
            elif "index.html" in os.listdir(path): # if directory
                idx_path = path + os.path.sep + "index.html"
                content_type = ("Content-type", self.detect_mime(idx_path))
                self.reply((200, self.read_bytes(idx_path), [content_type]))
            elif os.path.isdir(path) and os.path.exists(path):
                self.reply((200, self.print_dir(path), [("Content-type", "text/html")]))
            else:
                self.reply((500, "", []))

        def read_bytes(self, path):
            data = ""
            with open(path, "rb") as f:
                data = f.read()
            return data

        def get_worker(self, path, _workers):
            try:
                return [x for x in _workers if re.match("^" + x.path + "(/|$)", path)][0]
            except IndexError:
                return None

        def get_path(self, path):
            return urlparse(path).path

        def get_query(self, path):
            r = urlparse(path)
            if len(r.query) < 1:
                return None
            return {q.split("=")[0]: q.split("=")[1] if "=" in q else q for q in [x for x in r.query.split("&")]}

        def get_header_attributes(self, headers):
            attr = {}

            for header in str(headers).split("\n"):
                try:
                    attr[header.split(":")[0].strip()] = header.split(":")[1].strip()
                except:
                    pass

            return attr

        def print_dir(self, dir):
            s = ""

            for name in os.listdir(dir):
                if name != "__init__.py" and name != "__pycache__":
                    path = dir + os.path.sep + name
                    isD = "d" if os.path.isdir(path) else "f"
                    size = self.humanify(os.path.getsize(path)) if isD == "f" else "-"
                    link = "/".join(dir.split("/")[1:]) + "/" + name
                    if link[0] != "/": link = "/" + link
                    s += isD + " <a href=\"" + link + "\">" + name + "</a> " + str(size) + "<br>"

            return s

        def reply(self, result, with_header=True):  # result - (code, bytes/str, headers)
            if with_header:
                # print header
                self.send_response(result[0])
                for header in result[2]:
                    self.send_header(header[0], header[1])
                self.end_headers()

            # print content
            bodyType = type(result[1])
            if bodyType is str:
                self.wfile.write(bytes(result[1], "utf-8"))
            if bodyType is bytes or bodyType is bytearray:
                self.wfile.write(result[1])

        def filter(self, _filter, reqContext):
            if _filter:
                return _filter.filter(webRoot, reqContext)
            return True, 200, "", []

        def handle_exception(self):
            self.send_error(500)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

        def humanify(self, num, suffix='B'):
            for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
                if abs(num) < 1024.0:
                    return "%3.1f%s%s" % (num, unit, suffix)
                num /= 1024.0
            return "%.1f%s%s" % (num, 'Yi', suffix)

    return RequestHandler


class RequestContext():
    # clientAddress - (host, port), headers - {'key': 'value', }, method - "", path - "", query - {'key': 'value', }
    def __init__(self, clientAddress, headers, method, path, query):
        self.clientAddress = clientAddress
        self.headers = headers
        self.method = method
        self.path = path
        self.query = query

    def __str__(self):
        return "clientAddr: " + str(self.clientAddress) + "\n, headers: " + str(
            self.headers) + "\n, method: " + self.method + "\n, path: " + self.path + "\n, query: " + str(self.query)
