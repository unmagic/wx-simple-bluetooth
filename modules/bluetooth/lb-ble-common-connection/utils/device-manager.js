export default class DeviceManager {
    constructor(props) {
        this.clear();
    }

    getAllScanDevices({device}) {
        const {deviceId, RSSI} = device, {_devices: devices} = this;
        if (!!deviceId) {
            const temp = devices[deviceId];
            if (!temp) {
                devices[deviceId] = {RSSI, deviceId};
            } else {
                if (RSSI < 0 && temp.RSSI < RSSI) {
                    console.log('是否有副作用前', devices[deviceId]);
                    temp.RSSI = RSSI;
                    console.log('是否有副作用后', devices[deviceId]);
                }
            }
        }
        return {...devices};
    }


    findNearbyDevice() {
        setTimeout(() => {

        }, 4000);
    }

    clear() {
        this._devices = {};
    }
}
