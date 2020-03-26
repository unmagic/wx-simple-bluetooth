import BaseBlueTooth from "./base-bluetooth";
import {onBLEConnectionStateChange, onBluetoothAdapterStateChange, onBluetoothDeviceFound} from "./wx/apis";
import {CommonConnectState} from "../../lb-ble-common-state/state";
import {findTargetDeviceNeedConnectedFun} from "../utils/device-connection-manager";

const BLECloseRemindDialog = Symbol('BLECloseRemindDialog');

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
            console.log('开始扫描周边设备', res);
            if (!this._isConnectBindDevice) {
                this._isConnectBindDevice = true;
                try {
                    const {devices} = res, {targetDevice} = findTargetDeviceNeedConnectedFun({
                        devices,
                        targetDeviceName: this._targetDeviceName ?? ''
                    });
                    if (targetDevice) {
                        const {deviceId} = targetDevice;
                        console.log('baseDeviceFindAction 扫描到目标设备，并开始连接', deviceId, targetDevice);
                        try {
                            await this._updateBLEConnectFinalState({promise: super.createBLEConnection({deviceId})});
                        } catch (e) {
                            console.log('连接出现异常', e);
                            this._isConnectBindDevice = false;
                        }
                    } else {
                        console.log('本周期内未找到指定设备，开始下一个扫描周期');
                        this._isConnectBindDevice = false;
                    }
                } catch (e) {
                    console.error('请在connectTargetFun函数中捕获异常并消费掉，同事最后要返回对象{targetDevice}');
                    this._isConnectBindDevice = false;
                }
            } else {
                console.log('正在尝试连接中，所有忽略本次扫描结果');
            }
        });
    }

    setDefaultOnBLEConnectionStateChangeListener() {
        if (!this._onBLEConnectionStateChangeListener) {
            this._onBLEConnectionStateChangeListener = async ({deviceId, connected}) => {
                console.log('监听到蓝牙连接状态改变 deviceId=', deviceId, 'connected', connected);
                if (!connected) {
                    this.latestConnectState = {value: CommonConnectState.DISCONNECT, filter: true};
                    await this.openAdapterAndConnectLatestBLE();
                    // this.latestConnectState = CommonConnectState.DISCONNECT;
                    //     this.openAdapterAndConnectLatestBLE();
                }
            };
        }
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
                case 10000:
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
