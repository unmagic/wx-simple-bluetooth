# wx-simple-bluetooth

名称：wx-simple-bluetooth

适用平台：微信小程序

蓝牙：低功耗蓝牙

这个项目从蓝牙连接、蓝牙协议通信、状态订阅及通知三个层面进行设计，可以很方便的定制您自己的小程序的蓝牙开发。主要功能如下：

!!!需要先开启微信开发工具的增强编译!!!

## 已更新为2.x.x版本！
### 新的版本包括多种新的特性：

- 提供了完整的示例及较为详细的注释。
- 重构了蓝牙连接以及重连的整个流程，使其更加稳定和顺畅，也提高了部分场景下重连的速度。（有些蓝牙连接问题是微信兼容问题，目前是无法解决的。如错误码10003。如果您有很好的解决方案，还请联系我，十分感谢）
- 新增蓝牙协议配置文件，可以很方便的发送和接收蓝牙协议。
- 优化了蓝牙状态更新和蓝牙协议更新的订阅方式。现在可以更清晰的区分是状态更新还是接收到了新的协议（以及接收到的协议数据是什么），并且会过滤掉先后两条完全相同的通知。
- 可随时获取到最新的蓝牙连接状态。
- 各个业务均高度模块化。

以下均是在手机开启了蓝牙功能的情况下：
- 执行`getAppBLEManager.connect()`会自动扫描周围的蓝牙设备，并连接信号最强的设备。
- 可设置扫描周边蓝牙设备时，主 service 的 uuid 列表，以及对应的用于通信的服务id；还可额外添加蓝牙设备名称来进一步筛选设备。
- 可订阅蓝牙连接状态更新事件，并同步通知前端。
- 可订阅接收到的蓝牙协议，依据您的配置，框架内部会自行处理，并只返回您最需要的数据给前端。
- 注意：目前在发送数据时大于20包的数据会被裁剪为20包。


### 示例
- 蓝牙连接业务统一被封装在lb-ble-common-connection中。详见示例lb-example-bluetooth-manager.js。
- 蓝牙协议处理被拆分为多个子模块，分别为lb-ble-common-protocol-body(继承实现收发协议格式)、lb-ble-common-protocol-operator(继承实现收发操作)。详见示例lb-ble-example-protocol-body、lb-example-bluetooth-protocol.js
- 蓝牙状态统一被封装在lb-ble-common-state，可额外拓展。详见lb-bluetooth-state-example.js中示例。

该项目如有帮助，希望在GitHub上给个star！

## 快速集成示例


```
import MyBlueToothManager from "./my-bluetooth-manager";
import Toast from "../../view/toast";
import UI from './ui';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        devices: [],
        device: {},
        connectState: MyBlueToothManager.UNAVAILABLE
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.ui = new UI(this);
        this.bLEManager = new MyBlueToothManager();
        //这里我没有设置scanBLEListener，开启扫描后，程序会自动连接到距离手机最近的蓝牙设备
        //函数回调顺序：bleStateListener 先于 receiveDataListener
        this.bLEManager.setBLEListener({
            bleStateListener: ({state}) => {
                //常见的蓝牙连接状态见MyBreathBLManager
                console.log('状态', state);
                this.ui.setState({state});
            },
            receiveDataListener: ({finalResult}) => {
                //在这里的finalResult是经过dealReceiveData({result})处理后得到的结果

            },
            //如果你设置了这个监听函数，那么程序在扫描到设备后，只会返回扫描到的设备数组，而不会做其他任何事。需要你在这个函数中自行实现逻辑
            // scanBLEListener: ({devices}) => {
            //     //devices是蓝牙模块生效期间所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备
            // }
        });
    },

    /**
     * 断开连接
     * @param e
     */
    disconnectDevice(e) {
        this.bLEManager.disconnect().then(() => {
            this.setData({
                device: {}
            });
            setTimeout(Toast.success, 0, '已断开连接');
        });
    },
    /**
     * 扫描
     */
    connectHiBreathDevice() {
        this.bLEManager.connect();
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        this.bLEManager.closeAll();
    },
});

```

## 如何实现你自己的业务：

1. 新建一个类，继承`SimpleBlueToothImp`。
2. 重写发送数据方法`sendData({buffer})`。
3. 重写处理接收数据方法`dealReceiveData({result})`，并返回处理结果。
4. （不必须）依照你喜欢的方式，调用`setUUIDs`设置要搜索的主服务 `UUID` 数组。
5. （不必须）依据你自身的业务，赋予该类新的功能，如增加新的蓝牙状态类型、亦或是在关闭蓝牙时做出提示。

```
import SimpleBlueToothImp from "../../libs/bluetooth/simple-bluetooth-imp";
import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";

export default class MyBlueToothManager extends SimpleBlueToothImp {
    static UNAVAILABLE = BaseBlueToothImp.UNAVAILABLE;
    static DISCONNECT = BaseBlueToothImp.DISCONNECT;
    static CONNECTING = BaseBlueToothImp.CONNECTING;
    static CONNECTED = BaseBlueToothImp.CONNECTED;
    //这两个是根据你业务定义的蓝牙状态值，仅供参考
    static HANDSHAKE_SUCCESS = 'handshake_success';
    static RECEIVE_DATA_SUCCESS = 'receive_data_success';

    constructor() {
        super();
        this._isFirstReceive = true;
        this.setUUIDs({services: []});//设置主Services方式如 this.setUUIDs({services: ['xxxx']})  xxxx为UUID全称，可设置多个
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

    /**
     * 处理从蓝牙设备接收到的数据的具体实现
     * 这里会将处理后的数据，作为参数传递给setBLEListener的receiveDataListener监听函数。
     * 调用super.updateBLEStateImmediately({state})来立即更新蓝牙的状态
     * @param result ArrayBuffer类型 接收到的数据的最原始对象，该参数为从微信的onBLECharacteristicValueChange函数的回调参数
     * @returns {*}
     */
    dealReceiveData({result}) {
        if (this._isFirstReceive) {
            this._isFirstReceive = false;
            this._firstHandResponse();
            //立即更新状态值
            super.updateBLEStateImmediately({state: MyBlueToothManager.HANDSHAKE_SUCCESS});
        } else {
            //在这里是将接收到的数据，在队尾添加了总和及数据长度，又发送给了蓝牙设备。
            const byteLength = result.value.byteLength;
            const receiverDataView = new DataView(result.value, 0);
            const sendBuffer = new ArrayBuffer(byteLength + 2);
            const sendDataView = new DataView(sendBuffer, 0);
            let count = 0, temp;
            for (let k = 0; k < byteLength; k++) {
                temp = receiverDataView.getUint8(k);
                sendDataView.setUint8(k, temp);
                count += temp;
            }
            console.log('和', count, '长度', byteLength);
            count = count % 128;
            sendDataView.setUint8(byteLength, count);
            sendDataView.setUint8(byteLength + 1, byteLength);
            this.sendData({buffer: sendBuffer});
            //如果想要setBLEListener先接收数据，再延迟更新蓝牙状态值，可以设置setTimeout
            setTimeout(() => {
                super.updateBLEStateImmediately({state: MyBlueToothManager.RECEIVE_DATA_SUCCESS});
            })
        }
        MyBlueToothManager.logReceiveData({result});
        //这里的result已经是拥有了总和及数据长度的一个ArrayBuffer了，这里应该是返回与UI层的渲染相关的数据，所以我这里是一个错误的演示
        return {finalResult: result};
    }

    /**
     * 第一次连接成功时，程序会主动发送本机的时间戳给蓝牙设备
     * @private
     */
    _firstHandResponse() {
        const str = Date.now().toString();
        let strArray = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            strArray[i] = str.charCodeAt(i);
        }
        const array = new Uint8Array(strArray.length);
        strArray.forEach((item, index) => array[index] = item);
        this.sendData({buffer: array.buffer})
    }

    /**
     * 打印接收到的数据
     * @param result
     */
    static logReceiveData({result}) {
        const byteLength = result.value.byteLength;
        // const buffer = new ArrayBuffer(byteLength);
        const dataView = new DataView(result.value, 0);
        for (let k = 0; k < byteLength; k++) {
            console.log(`接收到的数据索引：${k} 值：${dataView.getUint8(k)}`);
        }
    }
};

```

## LINK

[Document](https://blog.csdn.net/sinat_27612147/article/details/84634432)

[LICENSE](https://github.com/unmagic/wx-simple-bluetooth/blob/master/LICENSE)

