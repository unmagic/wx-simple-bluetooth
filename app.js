import 'libs/adapter';
import MyBlueToothManager from "./modules/bluetooth/my-bluetooth-manager";

App({
    getBLEManager() {
        return this.bLEManager;
    },
    setBLEListener({receiveDataListener, bleStateListener}) {
        this.bLEManager.setBLEListener({receiveDataListener, bleStateListener});
    },
    onLaunch() {
        this.bLEManager = new MyBlueToothManager();
    },
    globalData: {}
});
