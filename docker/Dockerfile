FROM python:alpine3.6

RUN apk add --update --no-cache \
    openssl \
    wget \
    python3-dev \
    build-base \
    linux-headers \
    pcre-dev \
    zlib-dev \
    jpeg-dev

RUN pip3 --no-cache-dir install uwsgi

RUN mkdir -p /opt \
    && cd /opt \
    && wget https://github.com/tingtingths/PyPiePlayer/archive/master.zip \
    && unzip master.zip \
    && ls \
    && mv PyPiePlayer-master app \
    && rm *.zip \
    && mkdir /log \
    && pip3 install --no-cache-dir -r app/requirements.txt

COPY conf/* /opt/app/

EXPOSE 8000

CMD /usr/local/bin/uwsgi --ini /opt/app/pie.ini --logto /log/pie.log --wsgi-disable-file-wrapper
ENTRYPOINT /usr/local/bin/uwsgi --ini /opt/app/pie.ini --logto /log/pie.log --wsgi-disable-file-wrapper
