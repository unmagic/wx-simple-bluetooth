import CommonBLEConnectionOperation from "./base/common-ble-connection-operation";
import {CommonConnectState, CommonProtocolState} from "../lb-ble-common-state/state";

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

    /**
     * 该函数目前运行有问题，请勿调用，今后修正后再开放
     * 在扫描周围设备时，我们要以一定规则去连接合适的设备。
     * 该框架的默认规则是：扫描到周围所有设备，按照setFilter中配置的，在一个上报周期（350ms）内筛选出同一类蓝牙设备，选出信号最强的设备进行连接。
     * 如果连接失败，会重新扫描，再重复上述流程。
     * 默认规则是不记录上一个设备的。
     * 如果你想自己定义这个规则，那么请在此处重写该函数。
     * 如果使用默认规则，请不要重写该函数。
     * 在扫描周围设备时，会重复上报同一设备，上报周期350ms。
     * 每个周期内，如果在此处重写该函数，会回调一次该函数。
     * @param devices 该数据格式，是 onBluetoothDeviceFound 中返回的devices
     * @returns {{targetDevice: null}} 返回devices中的一个元素
     */
    // overwriteFindTargetDeviceForConnection({devices}) {
    //     //这样写，意思是在扫描周围设备时，优先连接微信返回的设备列表中，第一个设备
    //     //如果targetDevice传的是null，则会忽略本次扫描结果
    //     const [device] = devices;
    //     return {targetDevice: device && device.deviceId ? device : null};
    // }
}

const commonManager = Symbol();
export default class LBlueToothManager {
    constructor({debug = true} = {}) {
        this[commonManager] = new LBlueToothCommonManager({debug});
        // const fun = this.overwriteFindTargetDeviceForConnection;
        // if (typeof fun === "function") {
        //     this[commonManager].overwriteFindTargetDeviceForConnectedObj = {fun, context: this};
        // }
        // this[commonManager].init();
    }

    initBLEProtocol({bleProtocol}) {
        if (!this[commonManager].bluetoothProtocol) {
            bleProtocol.setBLEManager(this[commonManager]);
            this[commonManager].bluetoothProtocol = bleProtocol;
        }
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
     * @param services 必填 要搜索的蓝牙设备主 service 的 uuid 列表。详情见微信小程序官网，对于wx.startBluetoothDevicesDiscovery接口的介绍
     * @param targetServiceArray 必填 用于通信的服务uuid及对应的特征值、notify、read、write属性，目前只会与传入的第一组通信，后续会增加与多组服务通信的功能
     * @param targetDeviceName 非必填 蓝牙设备名称 与localName一致即可，区分大小写。如果不填写这一项或填写为空字符串，则将要连接的设备是经services过滤后的扫描到的第一个设备
     */
    setFilter({services, targetServiceArray, targetDeviceName}) {
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
