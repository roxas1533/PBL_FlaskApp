FROM python:3.8-buster as builder
# 使うコマンドをインストール
WORKDIR /opt/app
RUN \
    apt  update && \
    apt-get install -y git wget sudo && \
    git clone https://github.com/roxas1533/PBL_FlaskApp  /opt/app/pbl
COPY req.txt /opt/app
RUN pip3 install --upgrade pip
RUN pip3 install -r req.txt 

WORKDIR /opt/app/pbl

SHELL ["/bin/bash", "-c"]