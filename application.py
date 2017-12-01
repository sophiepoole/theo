#!/usr/bin/env python3

import logging
from logging.handlers import RotatingFileHandler
import sys
import signal
import threading

handler = RotatingFileHandler('theo.log', maxBytes=1000000, backupCount=4)
handler.setLevel(logging.INFO)
logger = logging.getLogger()
logger.addHandler(handler)

def handle_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return

    logger.error("Uncaught exception",
                 exc_info=(exc_type, exc_value, exc_traceback))
    os._exit(1)

sys.excepthook = handle_exception

def setup_thread_excepthook():
    """
    Workaround for `sys.excepthook` thread bug from:
    http://bugs.python.org/issue1230540

    Call once from the main thread before creating any threads.
    """

    init_original = threading.Thread.__init__

    def init(self, *args, **kwargs):

        init_original(self, *args, **kwargs)
        run_original = self.run

        def run_with_except_hook(*args2, **kwargs2):
            try:
                run_original(*args2, **kwargs2)
            except Exception:
                sys.excepthook(*sys.exc_info())

        self.run = run_with_except_hook

    threading.Thread.__init__ = init

setup_thread_excepthook()

from time import sleep
from datetime import datetime, time, timedelta
import json
import os
import atexit

from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import smbus2
import RPi.GPIO as GPIO

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
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 1

app.logger.addHandler(handler)

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

def is_heating_on():
    return GPIO.input(relay_gpio_channel) == GPIO.HIGH

def switch_heating(should_turn_heating_on):
    state = GPIO.HIGH if should_turn_heating_on else GPIO.LOW
    GPIO.output(relay_gpio_channel, state)

class ControlThread(threading.Thread):
    def __init__(self):
        self.lock = threading.Lock()
        self.loop_wait = 1
        self.heating_wait = timedelta(minutes=2)
        self.last_heating_change = datetime.now() - self.heating_wait
        self.should_exit = False
        super(ControlThread, self).__init__()

    def stop(self):
        self.should_exit = True

    def run(self):
        while not self.should_exit:
            with self.lock:
                target_temperature = None
                now = datetime.now()
                now_string = now.strftime("%H:%M")
                for span in schedule:
                    # We can just compare strings!
                    if (span["start"] < now_string < span["end"]):
                        if span["temperature"] != "":
                            target_temperature = int(span["temperature"])
                        break
                heating_should_be_on = False;
                try:
                    temperature = read_thermometer()
                    if target_temperature is not None:
                        heating_should_be_on = target_temperature > temperature
                except:
                    temperature = None
                if ((heating_should_be_on != is_heating_on())
                      and (now > self.last_heating_change + self.heating_wait)):
                    switch_heating(heating_should_be_on)
                    self.last_heating_change = now
                socketio.emit("server_state_broadcast",
                              {"temperature": temperature,
                               "target_temperature": target_temperature,
                               "schedule": schedule,
                               "heating_is_on": is_heating_on()})
            sleep(self.loop_wait)

thread = ControlThread()


@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("schedule_change")
def schedule_change(data):
    global thread
    with thread.lock:
        global schedule
        schedule = data


@atexit.register
def shutdown():
    switch_heating(False)
    save_schedule()

def signal_term_handler(signal, frame):
    thread.stop()
    thread.join()
    shutdown()
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_term_handler)


if __name__ == "__main__":
    thread.start()
    socketio.run(app, use_reloader=False, host="0.0.0.0", port=5000)
    thread.stop()
    thread.join()
