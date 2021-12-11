from flask import (
    request,
    jsonify,
)
import os
import json
from python_object.PrizeList import PrizeList
import pymysql.cursors

from python_object.SkinList import SkinList

secret_key = '_5#y2L"F43A8\n\0Sek;:"!\@'


def connectSQL():
    return pymysql.connect(
        host="127.0.0.1",
        # host="pbl_sqldb_1",
        # unix_socket="/var/run/mysqld/mysqld.sock",
        port=3306,
        user="root",
        password="password",
        db="sampleDB",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )


skinlist = SkinList()
prizelist = PrizeList(connectSQL())


def setSkin(conn, session, skinid):
    skinid = min(len(skinlist) - 1, int(skinid))
    try:
        with conn.cursor() as cursor:
            sql = "update user set skin=%s where name=%s"
            cursor.execute(sql, (skinid, session["username"]))
            conn.commit()
        return {"result": True}
    except Exception as e:
        e = str(e)
        print("setSkin-Error!", e)
        return {"result": False, "reason": "不明なエラー"}


def setSetting(conn, session, setting):
    try:
        setting = json.loads(setting)
        with conn.cursor() as cursor:
            name = setting.pop("name")
            sql = "update settings set {} where name=%s".format(
                ", ".join("{}=%s".format(k) for k in setting)
            )
            cursor.execute(sql, (list(setting.values()) + [name]))
            conn.commit()
        return {"result": True}
    except Exception as e:
        e = str(e)
        print("setSettingError!", e)
        return {"result": False, "reason": "不明なエラー"}


def getSkinList(conn, session):
    return {
        "list": skinlist.getSkinList(),
        "skin": 0 if "username" not in session else getUserSkin(conn, session),
    }


def getPrizeList():
    return {
        "prize_list": prizelist.getPrizeList(),
        "name_list": prizelist.getPrizeTypeNameList(),
    }


def getType2Prize(typeID):
    return prizelist.getType2Prize(typeID)


def getProfile(conn, session):
    return getProfileFromName(conn, session["username"])


def getUserSkin(conn, session):
    try:
        with conn.cursor() as cursor:
            sql = "select skin from user where name=%s"
            cursor.execute(sql, (session["username"],))
            re = cursor.fetchall()
            if len(re) == 0:
                return {"result": False, "reason": "存在しないユーザー名"}
            if len(re) > 1:
                raise Exception("複数一致")
        return re[0]["skin"]
    except Exception as e:
        e = str(e)
        print("getUserSkinエラー", e)
        return {"result": False, "reason": "不明なエラー"}


def getProfileFromName(conn, name):
    try:
        with conn.cursor() as cursor:
            sql = "select * from user where name=%s"
            cursor.execute(sql, (name,))
            re = cursor.fetchall()
            if len(re) == 0:
                return {"result": False, "reason": "存在しないユーザー名"}
            if len(re) > 1:
                raise Exception("複数一致")
            re = re[0]
            win = re["win"]
            lose = re["lose"]
            win_rato = 0 if win == 0 else win / (win + lose) * 100
        return {
            "result": True,
            "win_rato": round(win_rato, 1),
        } | re
    except Exception as e:
        e = str(e)
        print("getProfileFromNameエラー", e)
        return {"result": False, "reason": "不明なエラー"}


def getNameSession(cookie_str):
    import hashlib
    from itsdangerous import URLSafeTimedSerializer
    from flask.sessions import TaggedJSONSerializer

    salt = "cookie-session"
    serializer = TaggedJSONSerializer()
    signer_kwargs = {"key_derivation": "hmac", "digest_method": hashlib.sha1}
    s = URLSafeTimedSerializer(
        secret_key,
        salt=salt,
        serializer=serializer,
        signer_kwargs=signer_kwargs,
    )
    return s.loads(cookie_str)
