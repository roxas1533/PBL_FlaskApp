FROM python:3.8-buster as builder
# 使うコマンドをインストール
RUN \
    apt  update && \
    apt-get install -y git wget sudo
WORKDIR /opt/app
COPY req.txt /opt/app
RUN pip3 install --upgrade pip
RUN pip3 install -r req.txt 

WORKDIR /opt/app/pbl

SHELL ["/bin/bash", "-c"]