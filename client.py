from flask_socketio import emit
from Player import Player
import time
import random


instances = []


class Instance:
    def __init__(self, socketio, app) -> None:
        self.room = str(random.randint(0, 100000))
        self.Map = self.loadMap()
        self.clients = []
        self.socketio = socketio
        self.app = app

    def returnFirstData(self):
        for i, client in enumerate(self.clients):
            x = 60 if i % 2 == 0 else (len(self.Map[0]) - 2) * 30
            y = 60 if i % 2 == 0 else (len(self.Map) - 2) * 30
            client.player = Player(x, y, 30, 30, client.id)
        return {"Map": self.Map, "Player": [c.player.__dict__ for c in self.clients]}

    def returnUpdateData(self):
        return {"Player": [c.player.__dict__ for c in self.clients]}

    def loopInstance(self):
        while True:
            if len(self.clients) == 0:
                break
            for client in self.clients:
                client.player.update()
            # with self.app.test_request_context("/game"):
            self.socketio.emit("updateData", self.returnUpdateData(), to=self.room)
            time.sleep(0.0166)

    def __repr__(self):
        return "Instance(room:{},[{}])".format(self.room, self.clients)

    def loadMap(self):
        with open("map/map1.map") as mapFile:
            map = mapFile.read()
            row = map.split("\n")
            map = []
            for col in row:
                map.append([int(num) for num in col.split(",")])

            return map


class Client:
    def __init__(self, id, room) -> None:
        self.id = id
        self.room = room
        self.player = None

    def __repr__(self):
        return "Client(id:{},roomId:{})".format(self.id, self.room)

    def __eq__(self, other):
        if isinstance(other, Client):
            return self.id == other.id
        if isinstance(other, str):
            return self.id == other
        return NotImplemented


def addClient(newClientId, socketio, app):
    for instance in instances:
        if 0 < len(instance.clients) < 2:
            instance.clients.append(Client(newClientId, instance.room))
            print(instances)
            return instance.room, 2, instance

    instance = Instance(socketio, app)
    instance.clients.append(Client(newClientId, instance.room))
    instances.append(instance)
    print(instances)
    return instance.room, 1, None


def deleteClient(id):
    for instance in instances:
        try:
            instance.clients.remove(id)
            if len(instance.clients) == 0:
                instances.remove(instance)
        except ValueError:
            continue
    print(instances)


def updateKeyboard(key, id, room):
    for ins in instances:
        if ins.room == room:
            for cl in ins.clients:
                if cl.id == id:
                    cl.player.key = key
                    return


if __name__ == "__main__":
    Instance()
