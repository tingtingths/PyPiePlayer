##PySimpleHttpFramework
Instant deploy web application/page.
####Usage
    from simplewebframework.server.server import Server
    s = Server(8282)
    s.register("path/to/web_resources") # register www root
    s.run()
####Doc.
The framework support 3 types of resources.  
  - RequestFitler  
    Perform filtering task for the server, only one allowed
  - RequestWorker  
    Bind to a specific path and handle request to that path
  - directory (string path)

Each resource must be registered.
######E.g. Setup and register custom worker
    class MyWorker(RequestWorker):
      def __init__(self):
        super(MyWorker, self).__init__("/hello")
      
      def do_GET(self, req):
        return 200, "<h1>Hello World!</h1>", [("Content-type", "text/html")]
      
      def do_POST(self, req):
        return 0, "", []
        
    s.register(MyWorker())
######E.g. Setup and register filter
    class MyFilter(RequestFilter):
      
      # first return boolean value determine whether the request will be passed along.
      def filter(self, req):
        if "Authorization" not in req.headers:
          return False, 401, "No authorization...", [("WWW-Authenticate", "Basic realm=\"Secure area\"")]
        return True, 200, "You have authorization :)", []
        
    s.register(MyFilter())
*Read the sampleApp for more info.
