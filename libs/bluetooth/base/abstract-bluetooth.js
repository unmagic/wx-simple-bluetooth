/**
 * 微信小程序蓝牙功能的底层封装
 * 该类的所有业务均为最基础的部分，是不需要进行修改的
 * 呵呵哒认为这个类是抽象的，这就意味着该类只能被继承(虽然JS中没有抽象类)
 *
 */
export default class AbstractBlueTooth {
    constructor() {
        this._isOpenAdapter = false;
        this._isStartDiscovery = false;
        this._isActiveCloseBLE = false;
        this._deviceId = '';
        this._serviceId = '';
        this._characteristicId = '';
        this._receiveDataListener = null;
        this.UUIDs = [];
        this._receiveDataInsideListener = ({result}) => {
            if (!!this._receiveDataListener) {
                const {finalResult} = this.dealReceiveData({result});
                this._receiveDataListener({finalResult});
            }
        };
    }

    /**
     * 处理从连接的蓝牙中接收到的数据
     * 该函数必须在子类中重写！
     * 也千万不要忘了在重写时给这个函数一个返回值，作为处理数据后，传递给UI层的数据
     * 可以参考_receiveDataInsideListener
     * @param result 从连接的蓝牙中接收到的数据
     * @returns 传递给UI层的数据
     */
    dealReceiveData({result}) {

    }


    /**
     * 打开蓝牙适配器
     * 只有蓝牙开启的状态下，才可执行成功
     * @returns {Promise<any>}
     */
    openAdapter() {
        !this._deviceId && (this._deviceId = wx.getStorageSync('deviceId'));
        console.log('设备id', this._deviceId);
        return new Promise((resolve, reject) => {
            if (!this._isOpenAdapter) {
                wx.openBluetoothAdapter({
                    success: (res) => {
                        console.log('打开蓝牙Adapter成功', res);
                        wx.stopBluetoothDevicesDiscovery();
                        this._isOpenAdapter = true;
                        resolve({isOpenAdapter: this._isOpenAdapter});
                    }, fail: (res) => {
                        console.log('打开蓝牙Adapter失败', res);
                        reject(res);
                    }
                });
            } else {
                resolve({isOpenAdapter: this._isOpenAdapter});
            }
        });
    }

    /**
     * 关闭蓝牙适配器
     * @returns {Promise<any>}
     */
    closeAdapter() {
        return new Promise((resolve, reject) => {
            if (this._isOpenAdapter) {
                wx.stopBluetoothDevicesDiscovery();
                this.closeBLEConnection().finally(() => {
                    wx.closeBluetoothAdapter({
                        success: (res) => {
                            console.log('断开蓝牙Adapter成功', res);
                            this._resetInitData();
                            resolve({isOpenAdapter: this._isOpenAdapter});
                        }, fail: function (res) {
                            console.log('断开蓝牙Adapter失败', res);
                            reject(res);
                        }
                    })
                });
            } else {
                resolve({isOpenAdapter: this._isOpenAdapter});
            }
        })


    }


    /**
     * 清除上一次连接的蓝牙设备
     * 这会导致断开目前连接的蓝牙设备
     */
    clearConnectedBLE() {
        this.closeBLEConnection().finally(() => {
            wx.removeStorageSync('deviceId');
            this._deviceId = '';
        });
    }

    /**
     * 建立蓝牙连接
     * @param deviceId
     * @returns {Promise<any>}
     */
    createBLEConnection({deviceId}) {
        this._deviceId = deviceId;
        this.stopBlueToothDevicesDiscovery();
        return new Promise((resolve, reject) => {
                wx.createBLEConnection({
                    // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                    deviceId,
                    success: () => this._findThatCharacteristics({deviceId}).then(() => resolve({isConnected: true}), reject),
                    fail: reject
                })
            }
        );
    }

    /**
     * 断开处于连接状态的蓝牙连接
     * @returns {Promise<any>}
     */
    closeBLEConnection() {
        return new Promise((resolve, reject) => {
                wx.stopBluetoothDevicesDiscovery();
                this._isActiveCloseBLE = true;
                wx.closeBLEConnection({
                    deviceId: this._deviceId,
                    success: resolve, fail: reject
                })
            }
        )
    }

    /**
     * 设置UUID数组
     * 这会让你在扫描蓝牙设备时，只保留该UUID数组的蓝牙设备，过滤掉其他的所有设备，提高扫描效率
     * @param services
     */
    setUUIDs({services}) {
        if (Array.isArray(services)) {
            this.UUIDs = services;
        } else {
            AbstractBlueTooth._throwUUIDsIsNotArrayError();
        }
    }

    /**
     * 发送二进制数据
     * @param buffer ArrayBuffer
     * @returns {Promise<any>}
     */
    sendData({buffer}) {
        return new Promise((resolve, reject) => {
            wx.writeBLECharacteristicValue({
                deviceId: this._deviceId,
                serviceId: this._serviceId,
                characteristicId: this._characteristicId,
                value: buffer.slice(0, 20),
                success: resolve,
                fail: reject
            })
        })
    }

    /**
     * 停止蓝牙扫描
     * @returns {Promise<any>}
     */
    stopBlueToothDevicesDiscovery() {
        return new Promise((resolve, reject) => {
            if (this._isStartDiscovery) {
                wx.stopBluetoothDevicesDiscovery({
                    success: () => {
                        this._isStartDiscovery = false;
                        resolve({isStartDiscovery: this._isStartDiscovery});
                    }, fail: reject
                });
            } else {
                resolve({isStartDiscovery: this._isStartDiscovery});
            }
        });

    }

    /**
     * 开启蓝牙扫描
     * @returns {Promise<any>}
     */
    startBlueToothDevicesDiscovery() {
        return new Promise((resolve, reject) => {
            if (!this._isStartDiscovery) {
                wx.startBluetoothDevicesDiscovery({
                    services: this.UUIDs,
                    success: () => {
                        this._isStartDiscovery = true;
                        resolve({isStartDiscovery: this._isStartDiscovery});
                    }, fail: reject
                });
            } else {
                resolve({isStartDiscovery: this._isStartDiscovery});
            }
        });
    }

    /**
     * 获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备
     * @returns {Promise<any>}
     */
    getBlueToothDevices() {
        return new Promise(((resolve, reject) => wx.getBluetoothDevices({
            success: resolve, fail: reject
        })));
    }

    /**
     * 根据 uuid 获取处于已连接状态的设备。
     * @returns {Promise<any>}
     */
    getConnectedBlueToothDevices() {
        if (!Array.isArray(this.UUIDs)) {
            AbstractBlueTooth._throwUUIDsIsNotArrayError();
        }
        return new Promise((resolve, reject) =>
            wx.getConnectedBluetoothDevices({
                services: this.UUIDs,
                success: resolve, fail: reject
            }));
    }

    _findThatCharacteristics({deviceId}) {
        // return new Promise(((resolve, reject) => {
        return this._getBLEDeviceServices({deviceId}).then(({services}) => {

            for (let i = 0, length = services.length; i < length; i++) {
                let serverItem = services[i];
                if (serverItem.isPrimary) {
                    // 操作之前先监听，保证第一时间获取数据
                    wx.onBLECharacteristicValueChange((res) => {
                        this._receiveDataInsideListener({result: res});
                    });
                    return this._getBLEDeviceCharacteristics({deviceId, serviceId: serverItem.uuid});
                }
            }
        }).then(({characteristics, serviceId}) => {
            let read = -1, notify = -1, write = -1;
            for (let i = 0, len = characteristics.length; i < len; i++) {
                let item = characteristics[i], properties = item.properties, uuid = item.uuid;
                if (notify === -1 && (properties.notify || properties.indicate)) {
                    wx.notifyBLECharacteristicValueChange({
                        deviceId,
                        serviceId,
                        characteristicId: uuid,
                        state: true,
                    });
                    notify = i;
                }
                if (read === -1 && (properties.read)) {
                    read = i;
                    wx.readBLECharacteristicValue({
                        deviceId,
                        serviceId,
                        characteristicId: uuid,
                    });
                }
                if (read !== i && write === -1 && properties.write) {
                    write = i;
                    this._deviceId = deviceId;
                    this._serviceId = serviceId;
                    this._characteristicId = uuid;
                    wx.setStorage({key: 'deviceId', data: this._deviceId});
                }
            }
            // resolve();
        }).catch((error) => {
            console.log('_findThatCharacteristics log', error);
            // reject();
        });
        // }));

    }

    _getBLEDeviceServices({deviceId}) {
        return new Promise((resolve, reject) =>
            wx.getBLEDeviceServices({
                // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                deviceId,
                success(res) {
                    const {services} = res;
                    console.log('device services:', services);
                    resolve({services});
                }, fail: reject
            })
        );
    }

    _getBLEDeviceCharacteristics({deviceId, serviceId}) {
        return new Promise((resolve, reject) =>
            wx.getBLEDeviceCharacteristics({
                // 这里的 deviceId 需要已经通过 createBLEConnection 与对应设备建立链接
                deviceId,
                // 这里的 serviceId 需要在 getBLEDeviceServices 接口中获取
                serviceId,
                success(res) {
                    const {characteristics} = res;
                    console.log('device getBLEDeviceCharacteristics:', characteristics);
                    resolve({characteristics, serviceId});
                }, fail: reject
            }))
    }

    _resetInitData() {
        this._isOpenAdapter = false;
        this._isStartDiscovery = false;
    }

    static _throwUUIDsIsNotArrayError() {
        throw new Error('the type of services is Array!Please check it out.');
    }
}
