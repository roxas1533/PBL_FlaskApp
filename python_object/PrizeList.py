import os
import copy


class PrizeList:
    def __init__(self, conn) -> None:
        self.__prizeList = []
        self.__prizeTypeName = []
        self.__prizeLength = 0
        self.__type2Prize = []
        self.__prizeIDtoDict = {}
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
                self.__prizeLength = len(self.__prizeList)
                temp = copy.deepcopy(self.__prizeList)
                for p in self.__prizeList:
                    self.__prizeIDtoDict[int(p["id"])] = p
                    type = int(p["type_id"])
                    if len(self.__type2Prize) < type + 1:
                        self.__type2Prize.append([])
                    self.__type2Prize[type].append(p)

        except Exception as e:
            e = str(e)
            print("readSkin:", e)
            return {"result": False, "reason": "不明なエラー"}

    def getPrizeList(self):
        return self.__prizeList

    def getPrizeIDfromDict(self, id):
        return self.__prizeIDtoDict[id]

    def getPrizeTypeNameList(self):
        return self.__prizeTypeName

    def getType2Prize(self, typeID):
        return self.__type2Prize[typeID]

    def __len__(self):
        return self.__prizeLength
