import AbstractBlueTooth from "./abstract-bluetooth";

export default class BaseBlueToothImp extends AbstractBlueTooth {
    static UNAVAILABLE = 'unavailable';
    static DISCONNECT = 'disconnect';
    static CONNECTING = 'connecting';
    static CONNECTED = 'connected';

    constructor() {
        super();
        this._isInitWXBLEListener = false;
        this._scanBLDListener = null;
        this._bleStateListener = null;
        // super.getConnectedBlueToothDevices().then(res => {
        //     console.log('已连接的设备', res);
        // });

        this.errorType = {
            '-1': {
                errMsg: 'createBLEConnection:fail:already connect', type: BaseBlueToothImp.CONNECTED,
            },
            '10001': {
                errMsg: '', type: BaseBlueToothImp.UNAVAILABLE,
            },
            '10006': {
                errMsg: 'closeBLEConnection:fail:no connection', type: BaseBlueToothImp.DISCONNECT,
            }
        };
        let timeoutIndex = 0;
        wx.onBluetoothDeviceFound((devices) => {
            if (!!this._scanBLDListener) {
                this._scanBLDListener({devices});
            } else {
                clearTimeout(timeoutIndex);
                timeoutIndex = setTimeout(() => {
                    super.getBlueToothDevices().then((res) => {
                        const {devices} = res;
                        console.log('发现新的蓝牙设备', devices);
                        if (devices.length > 0) {
                            const device = devices.reduce((prev, cur) => prev.RSSI > cur.RSSI ? prev : cur);
                            console.log('要连接的设备', device);
                            if (!this._deviceId) {
                                this._updateFinalState({
                                    promise: this.createBLEConnection({deviceId: device.deviceId})
                                });
                            }
                        }
                    }).catch();
                }, 2000);
            }
        });
    }

    setBLEListener({receiveDataListener, bleStateListener, scanBLEListener}) {
        this._receiveDataListener = receiveDataListener;
        this._bleStateListener = bleStateListener;
        this._scanBLDListener = scanBLEListener;
    }

    triggerBLEAdapter() {
        return this._isOpenAdapter ? super.closeAdapter() : super.openAdapter();
    }

    triggerBLEDiscovery() {
        return this._isStartDiscovery ? super.stopBlueToothDevicesDiscovery() : super.startBlueToothDevicesDiscovery();
    }

    /**
     * 通过判断this._deviceId来确定是否为首次连接。
     * 如果是第一次连接，则需要开启蓝牙扫描，通过uuid过滤设备，来连接到对应的蓝牙设备，
     * 如果已经连接过了，则直接连接
     * @returns {*}
     */
    openAdapterAndConnectLatestBLE() {
        return !this._bleStateListener({state: BaseBlueToothImp.CONNECTING})
            && this._updateFinalState({
                promise: this.openAdapter().then(() => !!this._deviceId ?
                    this.createBLEConnection({deviceId: this._deviceId}) : this.startBlueToothDevicesDiscovery())
            });
    }

    reconnectBLE() {
        return !this._bleStateListener({state: BaseBlueToothImp.CONNECTING})
            && this._updateFinalState({promise: this.createBLEConnection({deviceId: this._deviceId})});
    }

    closeBLEConnection() {
        return this._updateFinalState({promise: super.closeBLEConnection()});
    }

    _updateFinalState({promise}) {
        return promise.then(({isConnected = false} = {}) => {
            if (!isConnected) {
                return;
            }
            if (!this._isInitWXBLEListener) {
                wx.onBluetoothAdapterStateChange((res) => {
                    console.log('适配器状态changed, now is', res);
                    if (!res.available) {
                        super.closeAdapter();
                    }
                });

                wx.onBLEConnectionStateChange((res) => {
                    // 该方法回调中可以用于处理连接意外断开等异常情况
                    console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`);
                    if (!res.connected) {
                        this._bleStateListener({state: BaseBlueToothImp.DISCONNECT});
                        if (!this._isActiveCloseBLE) {
                            this.reconnectBLE();
                        } else {
                            this._isActiveCloseBLE = false;
                        }
                    }
                });
                this._isInitWXBLEListener = true;
            }
            this._bleStateListener({state: BaseBlueToothImp.CONNECTED})
        })
            .catch((res) => {
                console.log(res);
                const errorFun = this.errorType[res.errCode];
                if (errorFun) {
                    this._bleStateListener({state: errorFun.type});
                } else {
                    this._bleStateListener({state: BaseBlueToothImp.DISCONNECT});
                }
            });
    }
}
