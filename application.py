from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import smbus2
import RPi.GPIO as GPIO

from time import sleep
from datetime import datetime, time
import threading
import os
import json
import atexit

# Schedule format:
# [
#   {"start": "hh:mm", "end": "hh:mm", "temperature": 19},
#   {"start": "hh:mm", "end": "hh:mm", "temperature": 20}
# ]
schedule_file = "schedule.json"
schedule = []

thermometer_bus = smbus2.SMBus(1)
thermometer_device_address = 0x48

relay_gpio_channel = 4
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(relay_gpio_channel, GPIO.OUT, initial=GPIO.LOW)

app = Flask(__name__)
app.config["SECRET_KEY"] = "19842977771387y398yr0ue091u09ue"
app.config["DEBUG"] = True

socketio = SocketIO(app)

def load_schedule():
    global schedule
    try:
        with open(schedule_file, "r") as f:
            schedule = json.load(f)
    except EnvironmentError:
        pass

def save_schedule():
    with open(schedule_file, "w") as f:
        json.dump(schedule, f)

def read_thermometer():
    """Get the temperature.

    Query a TMP102 attached to thermometer_device_address.
    """
    temp_reg_12bit = thermometer_bus.read_word_data(
        thermometer_device_address, 0
    )
    temp_low = (temp_reg_12bit & 0xff00) >> 8
    temp_high = (temp_reg_12bit & 0x00ff)
    # Convert to temp from page 6 of datasheet
    temp = ((temp_high*256) + temp_low) >> 4
    # Handle negative temps
    if temp > 0x7FF:
        temp -= 4096;
    temp_C = float(temp) * 0.0625
    return temp_C

def switch_heating(should_turn_heating_on):
    state = GPIO.HIGH if should_turn_heating_on else GPIO.LOW
    GPIO.output(relay_gpio_channel, state)

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
                target_temperature = None
                now = datetime.now().strftime("%H:%M")
                for span in schedule:
                    # We can just compare strings!
                    if (span["start"] < now < span["end"]):
                        target_temperature = span["temperature"]
                        break
                heating_should_be_on = False;
                try:
                    temperature = read_thermometer()
                    if (target_temperature is not None):
                        heating_should_be_on = target_temperature > temperature
                except:
                    temperature = None
                switch_heating(heating_should_be_on)
                socketio.emit("server_state_broadcast",
                              {"temperature": temperature,
                               "target_temperature": target_temperature,
                               "schedule": schedule,
                               "heating_is_on": heating_should_be_on})
            sleep(self.delay)

thread = SendStateThread()


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("schedule_change")
def schedule_change(data):
    global thread
    with thread.lock:
        global schedule
        if schedule:
            schedule = []
        else:
            schedule = data


@atexit.register
def shutdown():
    switch_heating(False)
    save_schedule()


if __name__ == "__main__":
    thread.start()
    socketio.run(app, use_reloader=False, host="0.0.0.0", port=5000)
    thread.stop()
    thread.join()
