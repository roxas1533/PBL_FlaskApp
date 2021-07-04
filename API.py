from flask import (
    request,
    jsonify,
)
import os


def getProfile(conn, session):
    return getProfileFromName(conn, session["username"])


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
            win = re[0]["win"]
            lose = re[0]["lose"]
            win_rato = 0 if win == 0 else win / (win + lose) * 100
        return {
            "result": True,
            "win": re[0]["win"],
            "lose": re[0]["lose"],
            "win_rato": round(win_rato, 1),
            "cv": re[0]["cv"],
        }
    except Exception as e:
        e = str(e)
        print("エラー", e)
        return {"result": False, "reason": "不明なエラー"}
    finally:
        cursor.close()


def getNameSession(cookie_str):
    import hashlib
    from itsdangerous import URLSafeTimedSerializer
    from flask.sessions import TaggedJSONSerializer

    salt = "cookie-session"
    serializer = TaggedJSONSerializer()
    signer_kwargs = {"key_derivation": "hmac", "digest_method": hashlib.sha1}
    s = URLSafeTimedSerializer(
        os.environ["SECRET"].encode(),
        salt=salt,
        serializer=serializer,
        signer_kwargs=signer_kwargs,
    )
    return s.loads(cookie_str)
