import BaseBlueToothImp from "./base-bluetooth-imp";

const bluetoothManager = Symbol('bluetoothManager');

export default class CommonBLEConnectionOperation {
    constructor() {
        this[bluetoothManager] = new BaseBlueToothImp();
        this[bluetoothManager].dealReceiveData = this.dealReceiveData.bind(this);

    }

    /**
     *
     * 订阅蓝牙连接状态变化事件和接收到新的蓝牙协议事件
     * 可只订阅其中一个
     * @param onConnectStateChanged 蓝牙连接状态变化事件
     * @param onReceiveData 接收到新的蓝牙协议事件
     */
    setBLEListener({onConnectStateChanged, onReceiveData}) {
        this[bluetoothManager].setBLEListener(arguments[0]);
    }

    /**
     * 在扫描周围蓝牙设备时，设置用于过滤无关设备的信息
     * 正常来说，该函数只需要调用一次
     * @param services 必填 要搜索的蓝牙设备主 service 的 uuid 列表。详情见微信小程序官网，对于wx.startBluetoothDevicesDiscovery接口的介绍
     * @param targetServiceArray 必填 在通信过程中，需要用到的服务uuid及对应的特征值、notify、read、write属性，目前只会与传入的第一组通信，后续会增加与多组服务通信的功能
     * @param targetDeviceName 非必填 蓝牙设备名称 与localName一致即可，区分大小写。如果不填写这一项或填写为空字符串，则将要连接的设备是经services过滤后的扫描到的第一个设备
     */
    setFilter({services, targetServiceArray, targetDeviceName}) {
        this[bluetoothManager].setFilter({services, targetDeviceName, targetServiceArray});
    }

    sendData({buffer}) {
        return this[bluetoothManager].sendData({buffer});
    }

    /**
     * 连接蓝牙
     * 默认的蓝牙扫描和连接规则是，同一设备重复上报，上报周期是250ms，在这一个周期内，去连接信号最强的设备
     * 如果连接失败了，会重新扫描、连接（重连的不一定是上一个设备）
     * 注意！！程序每次都会重新扫描周围设备再连接，并不会缓存上一次连接的设备直接用deviceId来连接
     * 异步执行
     * 可在子类中重写蓝牙扫描连接规则 详情见 lb-example-bluetooth-manager.js overwriteFindTargetDeviceForConnected
     */
    connect() {
        this[bluetoothManager].openAdapterAndConnectLatestBLE();
    }


    getConnectDevices() {
        return this[bluetoothManager].getConnectedBlueToothDevices();
    }

    getBLEAdapterState() {
        return this[bluetoothManager].getBlueToothAdapterState();
    }

    /**
     * 关闭蓝牙适配器
     * @returns {Promise<any>}
     */
    async closeAll() {
        await this[bluetoothManager].closeCurrentBLEConnection();
        return this[bluetoothManager].closeAdapter();
    }

    clearConnectedBLE() {
        return this[bluetoothManager].clearConnectedBLE();
    }

    updateBLEConnectState({connectState}) {
        this[bluetoothManager].latestConnectState = {value: connectState};
    }

    getBLELatestConnectState() {
        return this[bluetoothManager].latestConnectState.value;
    }

    executeBLEReceiveDataCallBack({protocolState, value}) {
        this[bluetoothManager].latestProtocolInfo = {protocolState, value};
    }

    /**
     * 处理从连接的蓝牙中接收到的数据
     * 该函数必须在子类中重写！
     * 也千万不要忘了在重写时给这个函数一个返回值，作为处理数据后，传递给UI层的数据
     * @param receiveBuffer 从连接的蓝牙中接收到的数据
     * @returns 传递给UI层的数据
     */
    dealReceiveData({receiveBuffer}) {

    }
};
