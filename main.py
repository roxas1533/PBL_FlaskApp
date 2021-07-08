from API import (
    SkinList,
    getNameSession,
    getProfile,
    getProfileFromName,
    getSkinList,
    getUserSkin,
    setSkin,
)
import os
import random
import threading
from client import Client, Instance, addClient, deleteClient, updateKeyboard
from flask import Flask
from flask import (
    request,
    render_template,
    make_response,
    jsonify,
    session,
    redirect,
    url_for,
    send_from_directory,
)
import time
import datetime
import json
import hashlib
from flask_socketio import SocketIO, emit, join_room
from engineio.payload import Payload
import pymysql.cursors

Payload.max_decode_packets = 50
import logging


log = logging.getLogger("werkzeug")
log.setLevel(logging.ERROR)
app = Flask(__name__)
socketio = SocketIO(app, async_mode="threading")
app.secret_key = os.environ["SECRET"].encode()
from flask_cors import CORS


def connectSQL():
    return pymysql.connect(
        host="127.0.0.1",
        unix_socket="/var/run/mysqld/mysqld.sock",
        port=3306,
        user="root",
        password="root",
        db="sampleDB",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


@app.route("/", methods=["GET", "POST"])
def hello():
    return render_template("index.html")


@app.route("/pointUpdate", methods=["POST"])
def pointupdate():
    if request.remote_addr != "127.0.0.1":
        return jsonify({"reason": "you cannot this API!!"}), 403
    data = request.data.decode("utf-8")
    data = json.loads(data)
    name = getNameSession(data["sessionid"])["username"]
    win = data["win"]
    try:
        conn = connectSQL()
        with conn.cursor() as cursor:
            sql = (
                "update user set win=win+%s ,lose=lose+%s, cv={} where name=%s".format(
                    "cv+1" if win else 0
                )
            )
            cursor.execute(sql, (win + 0, (not win) + 0, name))
        conn.commit()
        # re = cursor.fetchall()
        return jsonify({"result": True})
    except Exception as e:
        e = str(e)
        print("pointUpdateエラー", e)
        return jsonify({"result": False, "reason": "不明なエラー"})


@app.route("/game", methods=["GET"])
def game():
    if "username" not in session:
        res = make_response(render_template("notlogin.html"))
    else:
        res = make_response(
            render_template("loginedGame.html", username=session["username"])
        )
    return res


@app.route("/getName", methods=["POST"])
def getName():
    name = getNameSession(request.data.decode("utf-8"))["username"]

    conn = connectSQL()
    profile = getProfileFromName(conn, name)

    return jsonify({"username": name, "cv": profile["cv"], "skin": profile["skin"]})


@app.route("/regist", methods=["GET"])
def registHtml():
    return render_template("newRegist.html")


@app.route("/logout", methods=["POST"])
def logout():
    session.pop("username", None)
    return ""


@app.route("/login", methods=["GET"])
def loginHtml():
    if "username" not in session:
        return render_template("login.html")
    else:
        return render_template("loginedGame.html", username=session["username"])


@app.route("/profile", methods=["GET"])
def profile():
    conn = connectSQL()
    p = getProfile(conn, session)
    return render_template(
        "profile.html",
        username=session["username"],
        win=p["win"],
        lose=p["lose"],
        cv=p["cv"],
        win_rato=p["win_rato"],
    )


@app.route("/getSkinList", methods=["POST"])
def GetSkinList():
    conn = connectSQL()
    p = getSkinList(conn, session)
    return jsonify(p)


@app.route("/updateSkin", methods=["POST"])
def UpdateSkin():
    conn = connectSQL()
    p = setSkin(conn, session, request.data.decode("utf-8"))
    return jsonify(p)


@app.route("/login", methods=["POST"])
def login():
    data = json.loads(request.json)
    password = hashlib.sha256(data["password"].encode("utf-8")).hexdigest()
    try:
        conn = connectSQL()
        with conn.cursor() as cursor:
            sql = "select * from user where name=%s and password=%s"
            cursor.execute(sql, (data["username"], password))
            re = cursor.fetchall()
            if len(re) == 0:
                return jsonify({"result": False, "reason": "ユーザー名またはパスワードが違います"})
            if len(re) > 1:
                raise Exception("複数一致")
            session["username"] = re[0]["name"]
        return jsonify({"result": True})
    except Exception as e:
        e = str(e)
        print("loginエラー", e)
        return jsonify({"result": False, "reason": "不明なエラー"})


@app.route("/regist", methods=["POST"])
def regist():
    data = json.loads(request.json)
    password = hashlib.sha256(data["password"].encode("utf-8")).hexdigest()
    result = None
    while True:
        try:
            conn = connectSQL()
            with conn.cursor() as cursor:
                sql = "insert user (id,name,password) value({},%s,%s)".format(
                    random.randint(0, 100000)
                )
                cursor.execute(sql, (data["username"], password))

                sql = "select * from user where name=%s and password=%s"
                cursor.execute(sql, (data["username"], password))
                re = cursor.fetchall()
                conn.commit()
                session["username"] = re[0]["name"]
                break

        except Exception as e:
            e = str(e)
            if "user.name" in e:
                return jsonify({"result": False, "reason": "既に使用されているユーザー名です"})
            else:
                return jsonify({"result": False, "reason": "不明なエラー"})

            # if "user.id" in e:
    return jsonify({"result": True})


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, "static/img"),
        "favicon.ico",
    )


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
