from flask import Flask, render_template

from flask_socketio import SocketIO, emit

from random import random
from time import sleep
import threading
import os


app = Flask(__name__)
app.config["SECRET_KEY"] = "19842977771387y398yr0ue091u09ue"
app.config["DEBUG"] = True

socketio = SocketIO(app)

schedule = [0]*24

class SendStateThread(threading.Thread):
    def __init__(self):
        self.lock = threading.Lock()
        self.delay = 1
        self.should_exit = False
        super(SendStateThread, self).__init__()

    def stop(self):
        self.should_exit = True

    def run(self):
        while not self.should_exit:
            with self.lock:
                global schedule
                temperature = round(random()*10, 3)
                target_temperature = round(random()*10, 3)
                heating_is_on = True
                socketio.emit("server_state_broadcast",
                              {"temperature": temperature,
                               "target_temperature": target_temperature,
                               "schedule": schedule,
                               "heating_is_on": heating_is_on})
            sleep(self.delay)

thread = SendStateThread()


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('schedule_change')
def schedule_change(data):
    global thread
    with thread.lock:
        global schedule
        for key in data:
            schedule[int(key)] = data[key]
        print("Setting")
        print(schedule)


if __name__ == "__main__":
    thread.start()
    socketio.run(app, use_reloader=False)
    thread.stop()
    thread.join()
