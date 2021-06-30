import threading
from client import Client, Instance, addClient, deleteClient, updateKeyboard
from flask import Flask
from flask import request, render_template, request, make_response
import time
import datetime
import json
from flask_socketio import SocketIO, emit, join_room
from engineio.payload import Payload

Payload.max_decode_packets = 50
import logging


log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)
app = Flask(__name__)
socketio = SocketIO(app, async_mode="threading")


@app.route("/", methods=["GET", "POST"])
def hello():
    return render_template("index.html")


@app.route("/game", methods=["GET"])
def game():
    if request.cookies.get("user_id", None) is None:
        res = make_response(render_template("notlogin.html"))
    return res


@socketio.on("connect", namespace="/test")
def connect():
    print("Clinet connected")


@socketio.on("disconnect")
def disconnect():
    deleteClient(request.sid)


@socketio.on("message")
def handle_message(data):
    emit("res", data, broadcast=True)


@socketio.on("firstMessage")
def handle_message(data):
    room, num, ins = addClient(request.sid, socketio, app)
    join_room(room)
    emit("firstReturn", {"data": num, "room_name": room}, to=room)
    emit("id", {"id": request.sid})
    if num >= 2:
        emit("firstData", ins.returnFirstData(), to=room)
        thread = threading.Thread(target=ins.loopInstance)
        thread.start()
        print("thread Start")


@socketio.on("keyBoard")
def handle_message(data):
    updateKeyboard(data[0], request.sid, data[1])


if __name__ == "__main__":
    # app.run(debug=True)
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
