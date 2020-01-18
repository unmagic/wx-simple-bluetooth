import BaseBlueTooth from "./base-bluetooth";
import {onBLEConnectionStateChange, onBluetoothAdapterStateChange, onBluetoothDeviceFound} from "./wx/apis";
import {CommonConnectState} from "../../lb-ble-common-state/state";

const BLECloseRemindDialog = Symbol();
/**
 * 蓝牙核心业务的封装
 */
export default class BaseBlueToothImp extends BaseBlueTooth {

    constructor() {
        super();
        this._targetDeviceName = '';
        onBluetoothAdapterStateChange((function () {
            let available = true;
            return async (res) => {
                console.log('适配器状态changed, now is', res);
                // discovering
                const {available: nowAvailable} = res;
                if (!nowAvailable) {
                    this.dealBLEUnavailableScene();
                } else if (!available) {//当前适配器状态是可用的，但上一次是不可用的，说明是用户刚刚重新打开了
                    await this.closeAdapter();
                    await this.openAdapterAndConnectLatestBLE();
                }
                available = nowAvailable;
            }
        }).call(this));
        onBLEConnectionStateChange((res) => {
            // 该方法回调中可以用于处理连接意外断开等异常情况
            const {deviceId, connected} = res;
            console.log(`device ${deviceId} state has changed, connected: ${connected}`);
            if (this._onBLEConnectionStateChangeListener) {
                this._onBLEConnectionStateChangeListener({deviceId, connected});
            } else {
                console.log('未设置蓝牙连接状态变更事件监听，只有主动断开连接时才会触发该事件，所以本次事件不进行重新连接');
                this.latestConnectState = {value: CommonConnectState.DISCONNECT};
            }
        });

        onBluetoothDeviceFound(async (res) => {
            console.log('扫描到周边设备', res);
            if (!this._isConnectBindDevice) {
                const {devices} = res, {targetDevice} = this.findTargetDeviceNeedConnected({devices});
                if (targetDevice) {
                    const {deviceId} = targetDevice;
                    console.log('扫描到目标设备，并开始连接', deviceId, targetDevice);
                    await this._updateBLEConnectFinalState({promise: super.createBLEConnection({deviceId})});
                }
            }
        });
    }

    setDefaultOnBLEConnectionStateChangeListener() {
        if (!this._onBLEConnectionStateChangeListener) {
            this._onBLEConnectionStateChangeListener = async ({deviceId, connected}) => {
                console.log('监听到蓝牙连接状态改变', deviceId, connected);
                if (!connected) {
                    this.latestConnectState = {value: CommonConnectState.DISCONNECT, filter: true};
                    await this.openAdapterAndConnectLatestBLE();
                    // this.latestConnectState = CommonConnectState.DISCONNECT;
                    //     this.openAdapterAndConnectLatestBLE();
                }
            };
        }
    }

    /**
     * 找到需要连接的蓝牙设备
     * 该接口可被子类重写
     * @param devices 一个周期内扫描到的蓝牙设备，周期时长是wx.startBlueToothDevicesDiscovery接口中指定的interval时长
     * @returns {{targetDevice: null}|{targetDevice: *}}
     */
    findTargetDeviceNeedConnected({devices}) {
        const targetDeviceName = this._targetDeviceName, tempFilterArray = [];
        for (let device of devices) {
            if (!!targetDeviceName) {
                if (device.localName && device.localName.includes(targetDeviceName)) {
                    this._isConnectBindDevice = true;
                    tempFilterArray.push(device);
                }
            } else {
                this._isConnectBindDevice = true;
                tempFilterArray.push(device);
            }
        }
        if (tempFilterArray.length) {
            const device = tempFilterArray.reduce((pre, cur) => {
                return pre.RSSI > cur.RSSI ? pre : cur;
            });
            return {targetDevice: device};
        }
        return {targetDevice: null};
    }


    setFilter({services, targetDeviceName = '', targetServiceArray}) {
        this._targetDeviceName = targetDeviceName;
        super.setFilter({services, targetServiceArray});
    }

    clearConnectedBLE() {
        return super.clearConnectedBLE();
    }

    /**
     * 打开蓝牙适配器并扫描蓝牙设备，或是试图连接上一次的蓝牙设备
     * 通过判断this._deviceId来确定是否为首次连接。
     * 如果是第一次连接，则需要开启蓝牙扫描，通过uuid过滤设备，来连接到对应的蓝牙设备，
     * 如果之前已经连接过了，则这次会按照持久化的deviceId直接连接
     * @returns {*}
     */
    async openAdapterAndConnectLatestBLE() {
        const {value: latestConnectState} = this.latestConnectState;
        if (latestConnectState === CommonConnectState.CONNECTING || latestConnectState === CommonConnectState.CONNECTED) {
            console.warn(`openAdapterAndConnectLatestBLE 尝试蓝牙连接。蓝牙当前的连接状态为:${latestConnectState}，所以取消本次连接`);
            return;
        }
        console.warn('openAdapterAndConnectLatestBLE 连接前，读取最新的蓝牙状态：', latestConnectState || '未初始化');
        try {
            await this._updateBLEConnectFinalState({promise: super.openAdapter()});
            this.latestConnectState = {value: CommonConnectState.CONNECTING};
            // const connectedDeviceId = super.getConnectedDeviceId();
            // if (connectedDeviceId) {
            //     console.log(`上次连接过设备${connectedDeviceId}，现在直接连接该设备`);
            //     await this._updateBLEConnectFinalState({promise: await super.createBLEConnection({deviceId: connectedDeviceId})});
            // } else {
            // console.log('上次未连接过设备或直连失败，现开始扫描周围设备');
            console.log('openAdapterAndConnectLatestBLE 现开始扫描周围设备');
            await this.startBlueToothDevicesDiscovery();
        } catch (e) {
            switch (e.errorCode) {
                case 10001:
                    this.dealBLEUnavailableScene();
                    this[BLECloseRemindDialog]();
                    break;
            }
        }

    }

    async startBlueToothDevicesDiscovery() {
        this._isConnectBindDevice = false;
        try {
            return await super.startBlueToothDevicesDiscovery();
        } catch (e) {
            return await Promise.reject(e);
        }
    }

    /**
     * 统一处理一次蓝牙连接流程
     * 如果接收到失败，则是需要重新执行一遍扫描连接流程的情况
     * @param promise
     * @returns {Promise<*>}
     * @private
     */
    async _updateBLEConnectFinalState({promise}) {
        try {
            const result = await promise;
            if (result.isConnected && !result.filter) {
                this.latestConnectState = {value: CommonConnectState.CONNECTED};
            }
            return result;
        } catch (e) {
            console.warn('_updateBLEConnectFinalState 蓝牙连接出现问题', e);
            return await Promise.reject(e);
        }
    }

    [BLECloseRemindDialog]() {
        wx.showModal({title: '提示', content: '请先打开蓝牙', showCancel: false});
    }

    dealBLEUnavailableScene() {
        this.latestConnectState = {value: CommonConnectState.UNAVAILABLE};
        super.resetAllBLEFlag();
    }
}
