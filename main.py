from API import (
    SkinList,
    connectSQL,
    getNameSession,
    getPrizeIdFromDict,
    getPrizeList,
    getProfile,
    getProfileFromName,
    getSkinList,
    getType2Prize,
    getUserSkin,
    setSkin,
    secret_key,
    setSetting,
)
import os
import random
import inspect
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

Payload.max_decode_packets = 50
import logging


# log = logging.getLogger("werkzeug")
# log.setLevel(logging.ERROR)


def updateDefaultSetting():
    conn = connectSQL()
    with conn.cursor() as cursor:
        cursor.execute("select * from settings where name='default'")
        re = cursor.fetchall()
        if len(re) != 1:
            raise ValueError("error!")
    return re[0]


app = Flask(__name__)
# socketio = SocketIO(app, async_mode="threading")
# app.secret_key = os.environ["SECRET"].encode()
app.secret_key = secret_key
from flask_cors import CORS


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

    with conn.cursor() as cursor:
        cursor.execute("select * from settings where name=%s", session["username"])
        re = cursor.fetchall()
        if len(re) != 1:
            raise ValueError("error!")
    re = re[0]
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


@app.route("/getPrizeList", methods=["POST"])
def GetPrizeList():
    l = getPrizeList()
    if "username" not in session:
        return jsonify(l | {"open_prized": None})
    conn = connectSQL()
    with conn.cursor() as cursor:
        cursor.execute(
            "select selected_prize,opend_prize,point from user where name=%s",
            session["username"],
        )
        re = cursor.fetchall()[0]
    return jsonify(l | re)


@app.route("/openprize", methods=["POST"])
def openPrize():
    # {-1:"正常購入",0:"ポイント不足",1:"既にに開放済み",2:"不明"}
    if "username" not in session:
        return "", 401
    id = int(request.data.decode("utf-8"))
    conn = connectSQL()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "select point,opend_prize from user where name=%s", session["username"]
            )
            re = cursor.fetchall()[0]
            playerPoint = re["point"]
            playerOpened = re["opend_prize"]
            prizeData = getPrizeIdFromDict(id)
            if prizeData["need_point"] > playerPoint:
                return jsonify({"result": 0})
            if playerOpened & (1 << id):
                return jsonify({"result": 1})

            playerPoint -= prizeData["need_point"]
            playerOpened |= 1 << id

            cursor.execute(
                "update user set point=%s ,opend_prize=%s where name=%s",
                (playerPoint, playerOpened, session["username"]),
            )
            # conn.commit()
    except Exception as e:
        e = str(e)
        print(inspect.currentframe().f_code.co_name, "エラー", e)
        return "不明なエラー", 500

    return jsonify(
        {"result": -1, "playerPoint": playerPoint, "playerOpened": playerOpened}
    )


@app.route("/selectprize", methods=["POST"])
def selectPrize():
    if "username" not in session:
        return "", 401
    data = json.loads(request.data.decode("utf-8"))
    lists = getType2Prize(data["type_id"])
    conn = connectSQL()
    with conn.cursor() as cursor:
        cursor.execute(
            "select selected_prize,opend_prize from user where name=%s",
            session["username"],
        )
        re = cursor.fetchall()[0]
        playerOpened = re["opend_prize"]
        playerSelectedPrize = re["selected_prize"]
        # if not (playerOpened & 1 << data["id"]):
        #     return jsonify({"result": 0})
        for prize in lists:
            playerSelectedPrize &= ~(1 << prize["id"])
        playerSelectedPrize |= 1 << data["id"]
    return jsonify({"result": -1, "data": playerSelectedPrize})


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

                sql = "insert settings (name) value(%s)"
                cursor.execute(sql, (data["username"]))
                conn.commit()
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

    # subprocess.Popen(
    #     "{}/goserver/main".format(os.getcwd()), cwd="{}/goserver".format(os.getcwd())
    # )
    app.run(host="0.0.0.0", port=5000, debug=True)
