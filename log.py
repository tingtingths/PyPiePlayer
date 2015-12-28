def wlog(s):
    print(s)
    open("log", "a").write(s)
