import CommonBLEConnectionOperation from "./base/common-ble-connection-operation";
import {CommonConnectState, CommonProtocolState} from "../lb-ble-common-state/state";
import {setMyFindTargetDeviceNeedConnectedFun, setScanInterval} from "./utils/device-connection-manager";

const MAX_WRITE_NUM = 5, isDebug = Symbol('isDebug'), BLEPush = Symbol('BLEPush'),
    reWriteIndex = Symbol('reWriteIndex'), isAppOnShow = Symbol('isAppOnShow');

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
        const blePushArrayLength = this[BLEPush]?.length;
        if (blePushArrayLength) {
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

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    // closeAll() {
    //     this.bluetoothProtocol.clearSendProtocol();
    //     return super.closeAll();
    // }

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

const commonManager = Symbol();
export default class LBlueToothManager {
    constructor({debug = true} = {}) {
        this[commonManager] = new LBlueToothCommonManager({debug});
    }

    initBLEProtocol({bleProtocol}) {
        if (!this[commonManager].bluetoothProtocol) {
            bleProtocol.setBLEManager(this[commonManager]);
            this[commonManager].bluetoothProtocol = bleProtocol;
        }
    }

    /**
     * 重复上报时的过滤规则，并返回过滤结果
     * 在执行完该过滤函数，并且该次连接蓝牙有了最终结果后，才会在下一次上报结果回调时，再次执行该函数。
     * 所以如果在一次过滤过程中或是连接蓝牙，耗时时间很长，导致本次连接结果还没得到，就接收到了下一次的上报结果，则会忽略下一次{scanFilterRuler}的执行。
     * 如果不指定这个函数，则会使用默认的连接规则
     * 默认的连接规则详见 lb-ble-common-connection/utils/device-connection-manager.js的{defaultFindTargetDeviceNeedConnectedFun}
     * {scanFilterRuler}会传递两个参数{devices,targetDeviceName}
     * {devices}是wx.onBluetoothDeviceFound(cb)中返回的{devices}
     * {targetDeviceName}是{setFilter}中的配置项
     * {scanFilterRuler}最终返回对象{targetDevice}，是数组{devices}其中的一个元素；{targetDevice}可返回null，意思是本次扫描结果未找到指定设备
     * @param scanFilterRuler {function} 扫描过滤规则函数，需返回过滤结果
     */
    setMyFindTargetDeviceNeedConnectedFun({scanFilterRuler}) {
        setMyFindTargetDeviceNeedConnectedFun({scanFilterRuler});
    }

    /**
     * 连接蓝牙
     * 默认的蓝牙扫描和连接规则是，同一设备重复上报，上报周期是250ms，在这一个周期内，去连接信号最强的设备
     * 只有在获取到特征值并订阅了read和notify成功后，才会在{setBLEListener}中通知蓝牙连接成功
     * 如果连接失败了，会重新扫描、连接（重连的不一定是上一个设备）
     * 注意！！程序每次都会重新扫描周围设备再连接，并不会缓存上一次连接的设备直接用deviceId来连接
     * 连接结果不在该函数中返回，请在{setBLEListener}中订阅连接状态变化事件，来知晓连接结果
     * 可在子类中重写蓝牙扫描连接规则 详情见 lb-example-bluetooth-manager.js overwriteFindTargetDeviceForConnected
     */
    connect() {
        this[commonManager].connect();
    }

    /**
     * 订阅蓝牙连接状态变化事件和接收到新的蓝牙协议事件
     * 只有在获取到特征值并订阅了read和notify成功后，才会在{setBLEListener}中通知蓝牙连接成功
     * 可只订阅其中一个事件
     * @param onConnectStateChanged 蓝牙连接状态变化事件
     * @param onReceiveData 接收到新的蓝牙协议事件
     */
    setBLEListener({onConnectStateChanged, onReceiveData}) {
        this[commonManager].setBLEListener(arguments[0]);
    }

    /**
     * 在扫描周围蓝牙设备时，设置用于过滤无关设备的信息
     * 正常来说，该函数只需要调用一次
     * @param services {array}必填 要搜索的蓝牙设备主 service 的 uuid 列表。详情见微信小程序官网，对于wx.startBluetoothDevicesDiscovery接口的介绍
     * @param targetServiceArray {array}必填 用于通信的服务uuid及对应的特征值、notify、read、write属性，目前只会与传入的第一组通信，后续会增加与多组服务通信的功能
     * @param targetDeviceName {string}非必填 蓝牙设备名称 与localName一致即可，区分大小写。如果不填写这一项或填写为空字符串，则将要连接的设备是经services过滤后的扫描到的第一个设备
     * @param scanInterval {number}非必填，扫描周围设备，重复上报的时间间隔，毫秒制，默认是350ms
     */
    setFilter({services, targetServiceArray, targetDeviceName, scanInterval = 350}) {
        setScanInterval(scanInterval);
        this[commonManager].setFilter({services, targetDeviceName, targetServiceArray});
    }

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    async closeAll() {
        return await this[commonManager].closeAll();
    }


    /**
     * 获取最新的蓝牙连接状态
     * @returns {*}
     */
    getBLELatestConnectState() {
        return this[commonManager].getBLELatestConnectState();
    }

    /**
     * 获取本机蓝牙适配器状态
     * @returns {Promise<*>} 返回值见小程序官网 wx.getBluetoothAdapterState
     */
    getBLEAdapterState() {
        return this[commonManager].getBLEAdapterState();
    }

}
