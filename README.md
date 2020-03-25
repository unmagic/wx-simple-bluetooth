# wx-simple-bluetooth

名称：wx-simple-bluetooth

适用平台：微信小程序

蓝牙：低功耗蓝牙

这个项目从蓝牙连接、蓝牙协议通信、状态订阅及通知三个层面进行设计，可以很方便的定制您自己的小程序的蓝牙开发。主要功能如下：

<font color=red>!!!需要先开启微信开发工具的增强编译!!!</font>

`这个项目从蓝牙连接、蓝牙协议通信、状态订阅及通知三个层面进行设计，可以很方便的定制您自己的小程序的蓝牙开发。主要功能如下`：

以下是在手机开启了蓝牙功能、GPS以及微信定位权限的情况下：
- 执行`getAppBLEManager.connect()`会自动扫描周围的蓝牙设备，每`350ms`扫描一次，在该次内连接信号最强的设备。
- 可设置扫描周边蓝牙设备时，主 `service` 的 `uuid` 列表，以及对应的用于通信的服务id；还可额外添加蓝牙设备名称来进一步筛选设备。
- 可订阅蓝牙连接状态更新事件，并同步通知前端。
- 可订阅获取接收到的蓝牙协议事件。依据您的配置，框架内部会自行处理，并只返回最需要的数据给前端。
- `注意：目前在发送数据时大于20包的数据会被裁剪为20包`。

## 已更新为2.x.x版本！
### 新的版本包括多种新的特性：
- 提供了完整的示例及较为详细的注释。
- 重构了蓝牙连接以及重连的整个流程，使其更加稳定和顺畅，也提高了部分场景下重连的速度。`（有些蓝牙连接问题是微信兼容或是手机问题，目前是无法解决的。如错误码10003以及部分华为手机蓝牙连接或重连困难。如果您有很好的解决方案，还请联系我，十分感谢）`
- 新增蓝牙协议配置文件，可以很方便的发送和接收蓝牙协议。
- 优化了蓝牙状态更新和蓝牙协议更新的订阅方式。现在可以更清晰的区分是蓝牙的状态更新还是接收到了新的协议（以及接收到的协议数据是什么），并且会过滤掉与上一条完全相同的通知。
- 可随时获取到最新的蓝牙连接状态。
- 各个业务均高度模块化，在深入了解后，可以很方便的拓展。

```
注意：
1.必须按照约定的协议格式来制定协议，才能正常使用该框架
2.协议一包数据最多20个字节。该框架不支持大于20个字节的协议格式。
```

## 使用该框架必须要看的内容
<font color=red>注意：
1.必须按照约定的协议格式来制定协议，才能正常使用该框架
2.协议一包数据最多20个字节。该框架不支持大于20个字节的协议格式。
</font>
```
协议约定格式：[...命令字之前的数据(非必需), 命令字(必需), ...有效数据(非必需 如控制灯光发送255,255,255), 有效数据之后的数据(非必需 如协议结束标志校、验位等)
协议格式示例：[170(帧头), 10(命令字), 1(灯光开启),255,255,255(三个255,白色灯光),233(协议结束标志，有的协议中没有这一位),18(校验位，我胡乱写的)]

有效数据是什么：
在刚刚的这个示例中，帧头、协议结束标志是固定的值，校验位是按固定算法生成的，这些不是有效数据。而1,255,255,255这四个字节是用于控制蓝牙设备的，属于有效数据。
```
该项目如有帮助，希望在GitHub上给个star！

## 快速集成示例

- <font color=red>使用前必须检查手机是否开启蓝牙功能、定位功能、微信一定要给予定位权限（较新的iOS版微信要给予蓝牙权限）</font>
- 导入项目下的`modules`文件夹到你的项目

### 1、在小程序页面中设置事件订阅及蓝牙连接、断开示例

```
import Toast from "../../view/toast";
import UI from './ui';
import {ConnectState} from "../../modules/bluetooth/lb-bluetooth-state-example";
import {getAppBLEProtocol} from "../../modules/bluetooth/lb-example-bluetooth-protocol";
import {getAppBLEManager} from "../../modules/bluetooth/lb-example-bluetooth-manager";

const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        connectState: ConnectState.UNAVAILABLE
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.ui = new UI(this);
        console.log(app);
        //监听蓝牙连接状态、订阅蓝牙协议接收事件
        //多次订阅只会在最新订阅的函数中生效。
        //建议在app.js中订阅，以实现全局的事件通知
        getAppBLEManager.setBLEListener({
            onConnectStateChanged: async (res) => {
                const {connectState} = res;
                console.log('蓝牙连接状态更新', res);
                this.ui.setState({state: connectState});
                switch (connectState) {
                    case ConnectState.CONNECTED:
                        //在连接成功后，紧接着设置灯光颜色和亮度
                        await getAppBLEProtocol.setColorLightAndBrightness({
                            brightness: 100,
                            red: 255,
                            green: 0,
                            blue: 0
                        });

                        break;
                    default:

                        break;
                }

            },

            /**
             * 接收到的蓝牙设备传给手机的有效数据，只包含你最关心的那一部分
             * protocolState和value具体的内容是在lb-example-bluetooth-protocol.js中定义的
             *
             * @param protocolState 蓝牙协议状态值，string类型，值是固定的几种，详情示例见：
             * @param value 传递的数据，对应lb-example-bluetooth-protocol.js中的{effectiveData}字段
             */
            onReceiveData: ({protocolState, value}) => {
                console.log('蓝牙协议接收到新的 protocolState:', protocolState, 'value:', value);
            }
        });

        //这里执行连接后，程序会按照你指定的规则（位于getAppBLEManager中的setFilter中指定的），自动连接到距离手机最近的蓝牙设备
        getAppBLEManager.connect();
    },

    /**
     * 断开连接
     * @param e
     * @returns {Promise<void>}
     */
    async disconnectDevice(e) {
        // closeAll() 不仅会断开蓝牙连接及适配器，也会清空当前在协议发送队列中、但未发送的协议
        await getAppBLEManager.closeAll();
        this.setData({
            device: {}
        });
        setTimeout(Toast.success, 0, '已断开连接');
    },

    /**
     * 连接到最近的设备
     */
    connectHiBreathDevice() {
        getAppBLEManager.connect();
    },

    async onUnload() {
        await getAppBLEManager.closeAll();
    },
});

```

### 2、接下来是如何定制你自己的蓝牙业务：
#### 1. 设置你自己的`setFilter`函数参数。
文件位于`./modules/bluetooth/lb-example-bluetooth-manager.js`

```

import {LBlueToothManager} from "./lb-ble-common-connection/index";
import {getAppBLEProtocol} from "./lb-example-bluetooth-protocol";

/**
 * 蓝牙连接方式管理类
 * 初始化蓝牙连接时需筛选的设备，重写蓝牙连接规则
 */
export const getAppBLEManager = new class extends LBlueToothManager {
    constructor() {
        super();
        //setFilter详情见
        super.setFilter({
            services: ['0000xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],//必填
            targetServiceArray: [{
                serviceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',//必填
                writeCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxE',//必填
                notifyCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxF',//必填
                readCharacteristicId: '',//非必填
            }],
            targetDeviceName: '目标蓝牙设备的广播数据段中的 LocalName 数据段，如：smart-voice'//非必填
        });
        super.initBLEProtocol({bleProtocol: getAppBLEProtocol});
    }

    /**
     * 获取本机蓝牙适配器状态
     * @returns {Promise<*>} 返回值见小程序官网 wx.getBluetoothAdapterState
     */
    async getBLEAdapterState() {
        return await super.getBLEAdapterState();
    }

    /**
     * 获取最新的蓝牙连接状态
     * @returns {*}
     */
    getBLELatestConnectState() {
        return super.getBLELatestConnectState();
    }


}();


```
#### 2. 按约定的的蓝牙协议格式组装你自己的收发数据。

文件位于`./modules/bluetooth/lb-ble-example-protocol-body`

``` 
//send-body.js

import {IBLEProtocolSendBody} from "../lb-ble-common-protocol-body/index";
import {HexTools} from "../lb-ble-common-tool/index";

/**
 * 组装蓝牙协议发送数据示例
 * 该框架的蓝牙协议必须按照约定格式来制定，最多20个字节
 */
export default class SendBody extends IBLEProtocolSendBody {

    getDataBeforeCommandData({command, effectiveData} = {}) {
        //有效数据前的数据 该示例只返回了帧头110
        return [110];
    }

    getDataAfterEffectiveData({command, effectiveData} = {}) {
        //协议结束标志
        const endFlag = 233;
        //该示例中checkSum的生成规则是计算协议从第0个元素累加到结束标志
        let checkSum = endFlag + HexTools.hexToNum(command);
        for (let item of this.getDataBeforeCommandData()) {
            checkSum += item;
        }
        for (let item of effectiveData) {
            checkSum += item;
        }
        //生成有效数据之后的数据
        return [endFlag, checkSum];
    }
}
```
-----------------------------------

```
//receive-body.js

import {IBLEProtocolReceiveBody} from "../lb-ble-common-protocol-body/index";

/**
 * 组装蓝牙协议接收数据示例
 * 该框架的蓝牙协议必须按照约定格式来制定，最多20个字节
 */
export default class ReceiveBody extends IBLEProtocolReceiveBody {
    constructor() {
        //commandIndex 命令字位置索引
        //effectiveDataStartIndex  有效数据开始索引，比如：填写0，{getEffectiveReceiveDataLength}中返回20，则会在{LBlueToothProtocolOperator}的子类{getReceiveAction}实现中，在参数中返回所有数据
        super({commandIndex: 1, effectiveDataStartIndex: 0});
    }

    /**
     * 获取有效数据的字节长度
     * 该长度可根据接收到的数据动态获取或是计算，或是写固定值均可
     * 有效数据字节长度是指，在协议中由你的业务规定的具有特定含义的值的总字节长度
     * 有效数据更多的说明，以及该长度的计算规则示例，见 IBLEProtocolReceiveBody 类的 {getEffectiveReceiveData}函数
     *
     * @param receiveArray 接收到的一整包数据
     * @returns {number} 有效数据的字节长度
     */
    getEffectiveReceiveDataLength({receiveArray}) {
        return 20;
    }
}
```

#### 3. 实现对有效数据的发送、接收处理
位于`modules/bluetooth/lb-example-bluetooth-protocol.js`
```
import {LBlueToothProtocolOperator} from "./lb-ble-common-protocol-operator/index";
import SendBody from "./lb-ble-example-protocol-body/send-body";
import ReceiveBody from "./lb-ble-example-protocol-body/receive-body";
import {ProtocolState} from "./lb-bluetooth-state-example";

/**
 * 蓝牙协议管理类
 * 在这个类中，以配置的方式来编写读操作和写操作
 * 配置方式见下方示例
 */
export const getAppBLEProtocol = new class extends LBlueToothProtocolOperator {
    constructor() {
        super({protocolSendBody: new SendBody(), protocolReceiveBody: new ReceiveBody()});
    }

    /**
     * 写操作（仅示例）
     */
    getSendAction() {
        return {
            /**
             * 0x01：设置灯色（写操作）
             * @param red 0x00 - 0xff
             * @param green 0x00 - 0xff
             * @param blue 0x00 - 0xff
             * @returns {Promise<void>}
             */
            '0x01': async ({red, green, blue}) => {
                return await this.sendProtocolData({command: '0x01', effectiveData: [red, green, blue]});
            },

            /**
             * 0x02：设置灯亮度（写操作）
             * @param brightness 灯亮度值 0~100 对应最暗和最亮
             * @returns {Promise<void>}
             */
            '0x02': async ({brightness}) => {
                //data中的数据，填写多少个数据都可以，可以像上面的3位，也可以像这条6位。你只要能保证data的数据再加上你其他的数据，数组总长度别超过20个就行。
                return await this.sendProtocolData({command: '0x02', effectiveData: [brightness, 255, 255, 255, 255, 255]});
            },
        }
    }

    /**
     * 读操作（仅示例）
     * {dataArray}是一个数组，包含了您要接收的有效数据。
     * {dataArray}的内容是在lb-ble-example-protocol-body.js中的配置的。
     * 是由您配置的 dataStartIndex 和 getEffectiveReceiveDataLength 共同决定的
     */
    getReceiveAction() {
        return {
            /**
             * 获取设备当前的灯色（读）
             * 可return蓝牙协议状态protocolState和接收到的数据effectiveData，
             * 该方法的返回值，只要拥有非空的protocolState，该框架便会同步地通知前端同protocolState类型的消息
             * 当然是在你订阅了setBLEListener({onReceiveData})时才会在订阅的地方接收到消息。
             */
            '0x10': ({dataArray}) => {
                const [red, green, blue] = dataArray;
                return {protocolState: ProtocolState.RECEIVE_COLOR, effectiveData: {red, green, blue}};
            },
            /**
             * 获取设备当前的灯亮度（读）
             */
            '0x11': ({dataArray}) => {
                const [brightness] = dataArray;
                return {protocolState: ProtocolState.RECEIVE_BRIGHTNESS, effectiveData: {brightness}};
            },
            /**
             * 接收到设备主动发送的灯光关闭消息
             * 模拟的场景是，用户关闭了设备灯光，设备需要主动推送灯光关闭事件给手机
             */
            '0x12': () => {
                //你可以不传递effectiveData
                return {protocolState: ProtocolState.RECEIVE_LIGHT_CLOSE};
            },
            /**
             * 接收到蓝牙设备的其他一些数据
             */
            '0x13': ({dataArray}) => {
                //do something
                //你可以不返回任何值
            }
        };
    }

    /**
     * 设置灯亮度和颜色
     * @param brightness
     * @param red
     * @param green
     * @param blue
     * @returns {Promise<[unknown, unknown]>}
     */
    async setColorLightAndBrightness({brightness, red, green, blue}) {
        return Promise.all([this.sendAction['0x01']({red, green, blue}), this.sendAction['0x02']({brightness})]);
    }

}();
```
  
#### 4.（非必须）拓展蓝牙连接和协议状态。
文件位于`modules/bluetooth/lb-bluetooth-state-example.js`

```
import {CommonConnectState, CommonProtocolState} from "./lb-ble-common-state/index";

//特定的蓝牙设备的协议状态，用于拓展公共的蓝牙协议状态
//使用场景：
//在手机接收到蓝牙数据成功或失败后，该框架会生成一条消息，包含了对应的蓝牙协议状态值{protocolState}以及对应的{effectiveData}(effectiveData示例见 lb-example-bluetooth-protocol.js)，
//在{setBLEListener}的{onReceiveData}回调函数中，对应参数{protocolState}和{value}(value就是effectiveData)
const ProtocolState = {
    ...CommonProtocolState,
    RECEIVE_COLOR: 'receive_color',//获取到设备的颜色值
    RECEIVE_BRIGHTNESS: 'receive_brightness',//获取到设备的亮度
    RECEIVE_LIGHT_CLOSE: 'receive_close',//获取到设备灯光关闭事件
};

export {
    ProtocolState, CommonConnectState as ConnectState
};
```

## 深入了解框架
- 蓝牙连接业务统一被封装在`lb-ble-common-connection`中。详见示例`lb-example-bluetooth-manager.js`。
- 蓝牙协议处理被拆分为多个子模块，分别为`lb-ble-common-protocol-body`(继承实现收发协议格式)、`lb-ble-common-protocol-operator`(继承实现收发操作)。详见示例`lb-ble-example-protocol-body.`、`lb-example-bluetooth-protocol`
- 蓝牙状态统一被封装在`lb-ble-common-state`，可额外拓展。详见`lb-bluetooth-state-example.js`中示例。

## LINK

[Document](https://blog.csdn.net/sinat_27612147/article/details/84634432)

[LICENSE](https://github.com/unmagic/wx-simple-bluetooth/blob/master/LICENSE)

### 交流

技术交流请加QQ群：821711186

### 欢迎打赏

![微信打赏码](https://github.com/unmagic/.gif/blob/master/admire/weixin.png)
![支付宝二维码](https://github.com/unmagic/.gif/blob/master/admire/zhifubao.png)
