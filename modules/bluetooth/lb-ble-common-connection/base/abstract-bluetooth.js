/**
 * 微信小程序蓝牙功能的底层封装
 * 该类的所有业务均为最基础的部分，是不需要进行修改的
 * 呵呵哒认为这个类是抽象的，这就意味着该类只能被继承(虽然JS中没有抽象类)
 *
 */

import {
    closeBLEConnection,
    closeBlueToothAdapter,
    createBLEConnection,
    getBlueToothAdapterState,
    getConnectedBlueToothDevices,
    notifyBLE,
    onBLECharacteristicValueChange,
    openBlueToothAdapter,
    startBlueToothDevicesDiscovery,
    stopBlueToothDevicesDiscovery,
    writeBLECharacteristicValue
} from "./wx/apis";
import IBLEOperator from "./inter/i-ble-operator";
import {scanInterval} from "../utils/device-connection-manager";


// function dontNeedOperation({errMsg}) {
//     console.warn(errMsg);
//     return Promise.resolve({errMsg});
// }
// const bleDiscovery = {
//     isStartDiscovery: false,
//     /**
//      * 停止蓝牙扫描
//      * @returns {Promise<any>}
//      */
//     async stopBlueToothDevicesDiscovery() {
//         if (this.isStartDiscovery) {
//             const result = await stopBlueToothDevicesDiscovery();
//             this.isStartDiscovery = false;
//             console.log('关闭扫描周围设备');
//             return result;
//         } else {
//             return dontNeedOperation({errMsg: '已关闭了扫描周围蓝牙设备，无需再次关闭'});
//         }
//     },
//     async startBlueToothDevicesDiscovery() {
//         if (!this.isStartDiscovery) {
//             const result = await startBlueToothDevicesDiscovery({
//                 services: this.UUIDs,
//                 allowDuplicatesKey: true,
//                 interval: 300
//             });
//             console.log('开始扫描周围设备');
//             this.isStartDiscovery = true;
//             return result;
//         } else {
//             return dontNeedOperation({errMsg: '正在扫描周围蓝牙设备，无需再次开启扫描'});
//         }
//
//     }
// };
//
// const bleAdapter = {
//     isOpenAdapter: false,
//     /**
//      * 打开蓝牙适配器
//      * 只有蓝牙开启的状态下，才可执行成功
//      * @returns {Promise<any>}
//      */
//     async openAdapter() {
//         if (!this.isOpenAdapter) {
//             const result = await openBlueToothAdapter();
//             this.isOpenAdapter = true;
//             console.log('打开蓝牙适配器成功');
//             return result;
//         } else {
//             return dontNeedOperation({errMsg: '已打开了蓝牙适配器，无需重复打开'});
//         }
//     },
//
//     /**
//      * 关闭蓝牙适配器
//      * @returns {Promise<any>}
//      */
//     async closeAdapter() {
//         if (this.isOpenAdapter) {
//             const result = await closeBlueToothAdapter();
//             this.isOpenAdapter = false;
//             console.log('关闭蓝牙适配器成功');
//             return result;
//         } else {
//             return dontNeedOperation({errMsg: '已关闭了蓝牙适配器，无需重复关闭'});
//         }
//     }
// };

export default class AbstractBlueTooth extends IBLEOperator {
    constructor() {
        super();
        this.UUIDs = [];
        this._targetServiceArray = {};//暂时是service及write\read\notify特征值
    }

    async openAdapter() {
        return await openBlueToothAdapter();
    }

    async closeAdapter() {
        return await closeBlueToothAdapter();
    }

    resetAllBLEFlag() {
        // bleAdapter.isOpenAdapter = false;
        // bleDiscovery.isStartDiscovery = false;
    }


    async createBLEConnection({deviceId, valueChangeListener}) {
        // 操作之前先监听，保证第一时间获取数据
        await createBLEConnection({deviceId, timeout: 7000});
        onBLECharacteristicValueChange((res) => {
            console.log('接收到消息', res);
            if (!!valueChangeListener) {
                const {value, protocolState, filter} = this.dealReceiveData({receiveBuffer: res.value});
                !filter && valueChangeListener({protocolState, value});
            }
        });
        const {serviceId, writeCharacteristicId, notifyCharacteristicId, readCharacteristicId} = this._targetServiceArray;
        return await notifyBLE({
            deviceId,
            targetServiceUUID: serviceId,
            targetCharacteristics: {writeCharacteristicId, notifyCharacteristicId, readCharacteristicId}
        });
    }


    async closeBLEConnection({deviceId}) {
        return await closeBLEConnection({deviceId});
    }

    setFilter({services = [], targetServiceArray = []}) {
        if (Array.isArray(targetServiceArray) && targetServiceArray.length > 0) {
            this._targetServiceArray = targetServiceArray[0];
        } else {
            throw new Error('the type of targetServiceMap is not Array!Please check it out.');
        }
        if (Array.isArray(services)) {
            this.UUIDs = services;
        } else {
            AbstractBlueTooth._throwUUIDsIsNotArrayError();
        }
    }

    async sendData({buffer, deviceId, serviceId, characteristicId}) {
        return await writeBLECharacteristicValue({
            deviceId,
            serviceId,
            characteristicId,
            value: buffer.slice(0, 20)
        });
    }

    async startBlueToothDevicesDiscovery() {
        return await startBlueToothDevicesDiscovery({services: this.UUIDs, allowDuplicatesKey: true, interval: scanInterval});
    }

    async stopBlueToothDevicesDiscovery() {
        return await stopBlueToothDevicesDiscovery();
    }

    async getConnectedBlueToothDevices() {
        if (!Array.isArray(this.UUIDs)) {
            AbstractBlueTooth._throwUUIDsIsNotArrayError();
        }
        return await getConnectedBlueToothDevices({services: this.UUIDs});
    }

    async getBlueToothAdapterState() {
        return await getBlueToothAdapterState();
    }

    static _throwUUIDsIsNotArrayError() {
        throw new Error('the type of services is not Array!Please check it out.');
    }

}
