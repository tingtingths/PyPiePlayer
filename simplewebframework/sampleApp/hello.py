from simplewebframework.framework.worker import RequestWorker


class Hello(RequestWorker):
    def __init__(self):
        super(Hello, self).__init__("/hello")

    def do_GET(self, req):  # req - (clientAddress, headers, method, path, query)
        return 200, "<h1>Hello World!</h1>", [("Content-type", "text/html")]

    def do_POST(self, req):
        pass
