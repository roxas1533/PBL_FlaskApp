from flask import (
    request,
    jsonify,
)
import os
import json

secret_key = '_5#y2L"F43A8\n\0Sek;:"!\@'


class SkinList:
    def __init__(self) -> None:
        self.readSkin
        self.__skinList = []
        self.__skinLength = 0
        self.readSkin()

    def readSkin(self):
        with open("skinlist.csv") as f:
            for i, s_line in enumerate(f):
                if i == 0:
                    continue
                s_line = s_line.rstrip(os.linesep)
                skinData = s_line.split(",")
                self.__skinList.append({"body": skinData[0], "firearm": skinData[1]})
        self.__skinLength = len(self.__skinList)

    def getSkinList(self):
        return self.__skinList

    def __len__(self):
        return self.__skinLength


skinlist = SkinList()


def setSkin(conn, session, skinid):
    skinid = min(len(skinlist) - 1, int(skinid))
    try:
        cursor = conn.cursor()
        sql = "update user set skin=? where name=?"
        cursor.execute(sql, (skinid, session["username"]))
        conn.commit()
        conn.close()
        return {"result": True}
    except Exception as e:
        e = str(e)
        return {"result": False, "reason": "不明なエラー"}


def setSetting(conn, session, setting):
    try:
        setting = json.loads(setting)
        cursor = conn.cursor()
        sql = "update settings set show_damage=?,view_num=?,upkey=?,downkey=?,rightkey=?,\
            leftkey=?,firekey=?,useitemkey=?,rightarmrkey=?,leftarmrkey=? \
            where name=?"
        cursor.execute(
            sql,
            (
                setting["show_damage"],
                setting["view_num"],
                setting["upkey"],
                setting["downkey"],
                setting["rightkey"],
                setting["leftkey"],
                setting["firekey"],
                setting["useitemkey"],
                setting["rightarmrkey"],
                setting["leftarmrkey"],
                session["username"],
            ),
        )
        conn.commit()
        conn.close()
        return {"result": True}
    except Exception as e:
        e = str(e)
        print(e)
        return {"result": False, "reason": "不明なエラー"}


def getSkinList(conn, session):
    return {
        "list": skinlist.getSkinList(),
        "skin": 0 if "username" not in session else getUserSkin(conn, session),
    }


def getProfile(conn, session):
    return getProfileFromName(conn, session["username"])


def getUserSkin(conn, session):
    try:
        cursor = conn.cursor()
        sql = "select skin from user where name=?"
        cursor.execute(sql, (session["username"],))
        re = cursor.fetchall()
        if len(re) == 0:
            return {"result": False, "reason": "存在しないユーザー名"}
        if len(re) > 1:
            raise Exception("複数一致")
        conn.close()
        return re[0]
    except Exception as e:
        e = str(e)
        print("getUserSkinエラー", e)
        return {"result": False, "reason": "不明なエラー"}


def getProfileFromName(conn, name):
    try:
        cursor = conn.cursor()
        sql = "select * from user where name=?"
        cursor.execute(sql, (name,))
        re = cursor.fetchall()
        if len(re) == 0:
            return {"result": False, "reason": "存在しないユーザー名"}
        if len(re) > 1:
            raise Exception("複数一致")

        win = re[0][4]
        lose = re[0][5]
        win_rato = 0 if win == 0 else win / (win + lose) * 100
        conn.close()
        return {
            "result": True,
            "win": win,
            "lose": lose,
            "win_rato": round(win_rato, 1),
            "cv": re[0][6],
            "skin": re[0][7],
        }
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
