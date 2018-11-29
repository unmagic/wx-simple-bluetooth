import BaseBlueToothImp from "./base/base-bluetooth-imp";

export default class SimpleBlueToothImp {
    constructor() {
        this.bluetoothManager = new BaseBlueToothImp();
        this.bluetoothManager.dealReceiveData = this.dealReceiveData.bind(this);
    }

    /**
     * 设置蓝牙行为的监听
     * @param receiveDataListener 必须设置
     * @param bleStateListener 必须设置
     * @param scanBLEListener 不必须设置 如果没有设置该监听，则在扫描蓝牙设备后，会自动连接距离手机最近的蓝牙设备；否则，会返回扫描到的所有设备
     */
    setBLEListener({receiveDataListener, bleStateListener, scanBLEListener}) {
        this.bluetoothManager.setBLEListener(arguments[0]);
    }

    setUUIDs({services}) {
        this.bluetoothManager.setUUIDs({services});
    }

    sendData({buffer}) {
        return this.bluetoothManager.sendData({buffer});
    }

    /**
     * 连接蓝牙
     * @returns {*}
     */
    connect() {
        return this.bluetoothManager.openAdapterAndConnectLatestBLE();
    }

    /**
     * 断开蓝牙
     * @returns {*}
     */
    disconnect() {
        return this.bluetoothManager.closeBLEConnection();
    }

    getConnectDevices() {
        return this.bluetoothManager.getConnectedBlueToothDevices();
    }

    /**
     * 关闭蓝牙适配器
     * @returns {Promise<any>}
     */
    closeAll() {
        return this.bluetoothManager.closeAdapter();
    }

    clearConnectedBLE() {
        this.bluetoothManager.clearConnectedBLE();
    }

    /**
     * 处理从连接的蓝牙中接收到的数据
     * 该函数必须在子类中重写！
     * 也千万不要忘了在重写时给这个函数一个返回值，作为处理数据后，传递给UI层的数据
     * @param result 从连接的蓝牙中接收到的数据
     * @returns 传递给UI层的数据
     */
    dealReceiveData({result}) {

    }
};
