# Theo

## Enable IC2

`sudo raspi-config`
Interfacing Options -> I2C -> Yes

## Install dependencies

`pip3 install -r requirements.txt`

## Run

`python3 application.py`

## Run on system start

`sudo cp init.d/theo.sh /etc/init.d`
`sudo update-rc.d theo.sh defaults`
