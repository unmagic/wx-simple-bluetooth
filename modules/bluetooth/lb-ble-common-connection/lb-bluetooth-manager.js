import CommonBLEConnectionOperation from "./base/common-ble-connection-operation";
import {CommonConnectState, CommonProtocolState} from "../lb-ble-common-state/state";

const MAX_WRITE_NUM = 5, isDebug = Symbol(), BLEPush = Symbol(), reWriteIndex = Symbol(), isAppOnShow = Symbol();

class LBlueToothCommonManager extends CommonBLEConnectionOperation {

    constructor({debug = true} = {}) {
        super();
        this[isDebug] = debug;
        this[BLEPush] = [];
        this[reWriteIndex] = 0;
        this[isAppOnShow] = false;
        wx.onAppShow(() => {
            this[isAppOnShow] = true;
            if (this.getBLELatestConnectState() === CommonConnectState.CONNECTED) {
                setTimeout(async () => {
                    await this.resendBLEData();
                }, 20);
            } else {
                this[BLEPush].splice(0, this[BLEPush].length);
            }
        });
        wx.onAppHide(() => {
            this[isAppOnShow] = false;
        });
    }

    async resendBLEData() {
        if (this[BLEPush] && this[BLEPush].length) {
            let item;
            while (!!(item = this[BLEPush].shift())) {
                this[isDebug] && console.warn('回到前台，重新发送蓝牙协议', item);
                await this._sendData(item);
            }
        }
    }

    /**
     * 发送数据细节的封装
     * 这里根据你自己的业务自行实现
     * @param buffer
     */
    sendData({buffer}) {
        return new Promise((resolve, reject) => {
            this.sendDataCatchError({buffer}).then(resolve).catch(e => {
                if (!e.needReconnect) {
                    return reject(e);
                }
            });
        });
    }

    sendDataCatchError({buffer}) {
        return new Promise(async (resolve, reject) => {
            // if (buffer && buffer.byteLength) {
            if (this[isAppOnShow]) {
                await this._sendData({buffer, resolve, reject});
            } else {
                this[BLEPush].push({buffer, resolve, reject});
                this[isDebug] && console.warn('程序进入后台，停止发送蓝牙数据，数据放入队列', this[BLEPush]);
            }
        });
    }

    async _sendData({buffer, resolve, reject}) {
        try {
            const result = await super.sendData({buffer});
            this.reWriteIndex = 0;
            if (this[isDebug]) {
                console.log('writeBLECharacteristicValue success成功', result.errMsg);
                const dataView = new DataView(buffer, 0);
                const byteLength = buffer.byteLength;
                for (let i = 0; i < byteLength; i++) {
                    console.log(dataView.getUint8(i));
                }
            }
            resolve();
        } catch (e) {
            if (e.errCode === 10008 && this[reWriteIndex] <= MAX_WRITE_NUM) {
                this.reWriteIndex++;
                this[isDebug] && console.log('写入失败，错误代码10008，尝试重新写入；尝试次数', this.reWriteIndex);
                await this._sendData({buffer, resolve, reject});
            } else {
                const {available} = super.getBLEAdapterState();
                if (!available) {
                    this.reWriteIndex = 0;
                    this[isDebug] && console.log('写入失败，手机未开启蓝牙，详细原因', e);
                    reject({...e, needReconnect: false});
                } else {
                    this.reWriteIndex = 0;
                    this[BLEPush].push({buffer, resolve, reject});
                    this[isDebug] && console.log('写入失败，错误详情', e);
                    await this.closeAll();
                    this.connect();
                    reject({needReconnect: true});
                }
            }
        }
    }

    clearConnectedBLE() {
        return super.clearConnectedBLE();
    }

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    closeAll() {
        this.bluetoothProtocol.clearSendProtocol();
        return super.closeAll();
    }

    /**
     * 处理从蓝牙设备接收到的数据的具体实现
     * 这里会将处理后的数据，作为参数传递给setBLEListener的receiveDataListener监听函数。
     * @param receiveBuffer ArrayBuffer类型 接收到的数据的最原始对象，该参数为从微信的onBLECharacteristicValueChange函数的回调参数
     * @returns {*}
     */
    dealReceiveData({receiveBuffer}) {
        const {effectiveData, protocolState} = this.bluetoothProtocol.receive({receiveBuffer});
        if (CommonProtocolState.UNKNOWN === protocolState) {
            return {filter: true};
        }
        this.logReceiveData({receiveBuffer});
        return {value: effectiveData, protocolState};
    }

    /**
     * 打印接收到的数据
     * @param receiveBuffer
     */
    logReceiveData({receiveBuffer}) {
        if (this[isDebug]) {
            const byteLength = receiveBuffer.byteLength;
            const dataView = new DataView(receiveBuffer, 0);
            for (let k = 0; k < byteLength; k++) {
                console.log(`接收到的数据索引：${k} 值：${dataView.getUint8(k)}`);
            }
        }
    }
}

export default class LBlueToothManager {
    constructor({debug = true} = {}) {
        this.commonManager = new LBlueToothCommonManager({debug});
    }

    clearConnectedBLE() {
        return super.clearConnectedBLE();
    }

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    async closeAll() {
        return await this.commonManager.closeAll();
    }


    async resendBLEData() {
        await this.commonManager.resendBLEData();
    }

    /**
     * 发送数据细节的封装
     * 这里根据你自己的业务自行实现
     * @param buffer
     */
    sendData({buffer}) {
        return this.commonManager.sendData({buffer});
    }
}
