import SimpleBlueToothImp from "../../libs/bluetooth/simple-bluetooth-imp";
import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";
import BlueToothProtocol from "./bluetooth-protocol";

export default class MyBlueToothManager extends SimpleBlueToothImp {
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;

    constructor() {
        super();
        this._isFirstReceive = true;
        this.setUUIDs({services: ['6E400001-B5A3-F393-E0A9-E50E24DCCA9E']});//设置主Services方式如 this.setUUIDs({services: ['xxxx']})  xxxx为UUID全称，可设置多个
        this.bluetoothProtocol = new BlueToothProtocol(this);
    }

    /**
     * 发送数据细节的封装
     * 这里根据你自己的业务自行实现
     * @param buffer
     */
    sendData({buffer}) {
        if (buffer && buffer.byteLength) {
            super.sendData({buffer}).then(res => {
                console.log('writeBLECharacteristicValue success成功', res.errMsg);
                const dataView = new DataView(buffer, 0);
                const byteLength = buffer.byteLength;
                for (let i = 0; i < byteLength; i++) {
                    console.log(dataView.getUint8(i));
                }
            }).catch(res => console.log(res));
        } else {
            console.log('发送的buffer是空');
        }
    }

    /**
     * 断开蓝牙连接
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    disconnect() {
        return super.disconnect().then(() => this._isFirstReceive = true);
    }

    /**
     * 关闭蓝牙适配器
     * 调用此接口会先断开蓝牙连接，停止蓝牙设备的扫描，并关闭蓝牙适配器
     * @returns {PromiseLike<boolean | never> | Promise<boolean | never>}
     */
    closeAll() {
        return super.closeAll().then(() => this._isFirstReceive = true);
    }

    sendDeviceIdRequire() {
        this.bluetoothProtocol.requireDeviceId();
    }

    /**
     * 处理从蓝牙设备接收到的数据的具体实现
     * 这里会将处理后的数据，作为参数传递给setBLEListener的receiveDataListener监听函数。
     * @param receiveBuffer ArrayBuffer类型 接收到的数据的最原始对象，该参数为从微信的onBLECharacteristicValueChange函数的回调参数
     * @returns {*}
     */
    dealReceiveData({receiveBuffer}) {
        const {dataAfterProtocol, state} = this.bluetoothProtocol.receive({receiveBuffer});
        super.updateBLEStateImmediately({state});
        MyBlueToothManager.logReceiveData({receiveBuffer});
        dataAfterProtocol.forEach(item => console.log(`经过协议处理后的数据：${item}`));
        let finalResult = dataAfterProtocol;
        //这里的result已经是拥有了总和及数据长度的一个ArrayBuffer了，这里应该是返回与UI层的渲染相关的数据，所以我这里是一个错误的演示
        return {finalResult};
    }

    /**
     * 打印接收到的数据
     * @param receiveBuffer
     */
    static logReceiveData({receiveBuffer}) {
        const byteLength = receiveBuffer.value.byteLength;
        // const buffer = new ArrayBuffer(byteLength);
        const dataView = new DataView(receiveBuffer.value, 0);
        for (let k = 0; k < byteLength; k++) {
            console.log(`接收到的数据索引：${k} 值：${dataView.getUint8(k)}`);
        }
    }
};
