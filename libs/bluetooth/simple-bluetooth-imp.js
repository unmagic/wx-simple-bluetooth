import BaseBlueToothImp from "./base/base-bluetooth-imp";

export default class SimpleBlueToothImp {
    constructor() {
        this.bluetoothManager = new BaseBlueToothImp();
        this.bluetoothManager.dealReceiveData = this.dealReceiveData.bind(this);
    }

    setBLEListener({receiveDataListener, bleStateListener, scanBLEListener}) {
        this.bluetoothManager.setBLEListener(arguments[0]);
    }

    setUUIDs({services}) {
        this.bluetoothManager.setUUIDs({services});
    }

    sendData({buffer}) {
        return this.bluetoothManager.sendData({buffer});
    }

    connect() {
        return this.bluetoothManager.openAdapterAndConnectLatestBLE();
    }

    disconnect() {
        return this.bluetoothManager.closeBLEConnection();
    }

    getConnectDevices() {
        return this.bluetoothManager.getConnectedBlueToothDevices();
    }
    closeAll() {
        return this.bluetoothManager.closeAdapter();
    }

    clearConnectedBLE() {
        this.bluetoothManager.clearConnectedBLE();
    }
    dealReceiveData({result}) {

    }
};
