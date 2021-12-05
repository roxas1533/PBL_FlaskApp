import os


class PrizeList:
    def __init__(self, conn) -> None:
        self.__prizeList = []
        self.__prizeTypeName = []
        self.__prizeLength = 0
        self.readSkin(conn)

    def readSkin(self, conn):
        try:
            with conn.cursor() as cursor:
                cursor.execute("select * from prize_lists")
                re = cursor.fetchall()
                self.__prizeList = re
                self.__prizeLength = len(re)
                cursor.execute("select name from prize_names")
                re = cursor.fetchall()
                self.__prizeTypeName = [r["name"] for r in re]

        except Exception as e:
            e = str(e)
            print("readSkin", e)
            return {"result": False, "reason": "不明なエラー"}
            self.__prizeLength = len(self.__prizeList)

    def getPrizeList(self):
        return self.__prizeList

    def getPrizeTypeNameList(self):
        return self.__prizeTypeName

    def __len__(self):
        return self.__prizeLength
