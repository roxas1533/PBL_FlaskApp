from API import (
    SkinList,
    getNameSession,
    getProfile,
    getProfileFromName,
    getSkinList,
    getUserSkin,
    setSkin,
    secret_key,
    setSetting,
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
from engineio.payload import Payload
import sqlite3

Payload.max_decode_packets = 50
import logging


# log = logging.getLogger("werkzeug")
# log.setLevel(logging.ERROR)
settingDict = [
    "name",
    "show_damage",
    "view_num",
    "upkey",
    "downkey",
    "rightkey",
    "leftkey",
    "firekey",
    "useitemkey",
    "rightarmrkey",
    "leftarmrkey",
]


def updateDefaultSetting():
    conn = connectSQL()
    cursor = conn.cursor()
    cursor.execute("select * from settings where name='default'")
    re = cursor.fetchall()
    if len(re) != 1:
        raise ValueError("error!")
    conn.close()
    return {settingDict[i]: re[0][i] for i in range(len(re[0]))}


app = Flask(__name__)
# socketio = SocketIO(app, async_mode="threading")
# app.secret_key = os.environ["SECRET"].encode()
app.secret_key = secret_key


def connectSQL():
    return sqlite3.connect("sampleDB.db")


defaultSetting = None
defaultSetting = updateDefaultSetting()


@app.route("/", methods=["GET", "POST"])
def hello():
    return redirect(url_for("game"))


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
        cursor = conn.cursor()
        sql = "update user set win=win+? ,lose=lose+?, cv={} where name=?".format(
            "cv+1" if win else 0
        )
        cursor.execute(sql, (win + 0, (not win) + 0, name))
        conn.commit()
        conn.close()
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
    if "username" not in session:
        return "", 401
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


@app.route("/setting", methods=["POST"])
def setting():
    if "username" not in session:
        return jsonify(
            {
                "main": None,
                "game": None,
                "key": None,
                "setting": defaultSetting,
                "defaultSetting": defaultSetting,
            }
        )

    conn = connectSQL()

    cursor = conn.cursor()
    cursor.execute("select * from settings where name=?", (session["username"],))
    re = cursor.fetchall()
    if len(re) != 1:
        raise ValueError("error!")
    re = {settingDict[i]: re[0][i] for i in range(len(re[0]))}
    conn.close()
    settingmain = render_template(
        "setting.html",
    )
    gamesetting = render_template(
        "gamesetting.html",
    )
    keysetting = render_template(
        "keysetting.html",
    )
    return jsonify(
        {
            "main": settingmain,
            "game": gamesetting,
            "key": keysetting,
            "setting": re,
            "defaultSetting": defaultSetting,
        }
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


@app.route("/updateSetting", methods=["POST"])
def updateSetting():
    conn = connectSQL()
    p = setSetting(conn, session, request.data.decode("utf-8"))
    return jsonify(p)


@app.route("/login", methods=["POST"])
def login():
    data = json.loads(request.json)
    password = hashlib.sha256(data["password"].encode("utf-8")).hexdigest()
    try:
        conn = connectSQL()
        cursor = conn.cursor()
        sql = "select name from user where name=? and password=?"
        cursor.execute(sql, (data["username"], password))
        re = cursor.fetchall()
        if len(re) == 0:
            return jsonify({"result": False, "reason": "ユーザー名またはパスワードが違います"})
        if len(re) > 1:
            raise Exception("複数一致")
        session["username"] = re[0][0]
        conn.close()
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
            cursor = conn.cursor()
            sql = "insert user (id,name,password) value({},?,?)".format(
                random.randint(0, 100000)
            )
            cursor.execute(sql, (data["username"], password))

            sql = "select name from user where name=? and password=?"
            cursor.execute(sql, (data["username"], password))
            re = cursor.fetchall()
            conn.commit()
            session["username"] = re[0][0]

            sql = "insert settings (name) value(?)"
            cursor.execute(sql, (data["username"]))
            conn.commit()
            conn.close()
            break

        except Exception as e:
            e = str(e)
            if "user.name" in e:
                return jsonify({"result": False, "reason": "既に使用されているユーザー名です"})
            else:
                print(e)
                return jsonify({"result": False, "reason": "不明なエラー"})

            # if "user.id" in e:
    return jsonify({"result": True})


@app.route("/favicon.ico")
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, "static/img"),
        "favicon.ico",
    )


if __name__ == "__main__":
    # app.run(debug=True)
    import subprocess

    subprocess.Popen(
        "{}/goserver/main".format(os.getcwd()), cwd="{}/goserver".format(os.getcwd())
    )
    print("PORT!:", os.environ.get("PORT"))
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
