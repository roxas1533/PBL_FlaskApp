import os


class SkinList:
    def __init__(self) -> None:
        self.readSkin
        self.__skinList = []
        self.__skinLength = 0
        self.readSkin()

    def readSkin(self):
        with open("csv/skinlist.csv") as f:
            key = []
            for i, s_line in enumerate(f):
                s_line = s_line.rstrip(os.linesep)
                readData = s_line.split(",")
                if i == 0:
                    key = readData
                    continue
                self.__skinList.append(dict(zip(key, readData)))
        self.__skinLength = len(self.__skinList)

    def getSkinList(self):
        return self.__skinList

    def __len__(self):
        return self.__skinLength
