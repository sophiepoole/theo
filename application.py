from flask import Flask, render_template

from flask_socketio import SocketIO, emit

import smbus2

from random import random
from time import sleep
import threading
import os
import RPi.GPIO as GPIO
import atexit

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

def read_thermometer():
    """Get the temperature.

    Query a TMP102 attached to thermometer_device_address.
    """
    temp_reg_12bit = thermometer_bus.read_word_data(thermometer_device_address,
                                                    0)
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

atexit.register(switch_heating, False)

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
                target_temperature = 22.0
                try:
                    temperature = read_thermometer()
                    heating_should_be_on = target_temperature > temperature
                except:
                    temperature = None
                    heating_should_be_on = False;

                switch_heating(heating_should_be_on)

                socketio.emit("server_state_broadcast",
                              {"temperature": temperature,
                               "target_temperature": target_temperature,
                               "heating_is_on": heating_should_be_on})
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
    socketio.run(app, use_reloader=False, host="0.0.0.0", port=5000)
    thread.stop()
    thread.join()
