import serial
def read_teensy(port='/dev/ttyACM0', baud=9600):
    with serial.Serial(port, baud, timeout=1) as ser:
        return ser.readline().decode().strip()
