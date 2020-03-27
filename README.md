# wx-simple-bluetooth

名称：wx-simple-bluetooth

适用平台：微信小程序

蓝牙：低功耗蓝牙

项目版本：2.0.1

这个项目从蓝牙连接、蓝牙协议通信、状态订阅及通知三个层面进行设计，可以很方便的定制您自己的小程序的蓝牙开发。主要功能如下：

**!!!需要先开启微信开发工具的增强编译!!!**

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
- 只有在连接到蓝牙设备并使用特征值注册了read、write、notify监听后才算连接成功。
- 在扫描周围设备时，可按自定义的规则过滤多余设备，连接指定设备。详见示例`lb-example-bluetooth-manager.js`。 
- 新增蓝牙协议配置文件，可以很方便的发送和接收蓝牙协议。
- 小程序退入后台会自动缓存要发送的协议，待回到前台后重新发送（如果[小程序冷启动](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/operating-mechanism.html)了，则协议队列会被重新初始化）。
- 优化了蓝牙状态更新和蓝牙协议更新的订阅方式。现在可以更清晰的区分是蓝牙的状态更新还是接收到了新的协议（以及接收到的协议数据是什么），并且会过滤掉与上一条完全相同的通知。
- 可随时获取到最新的蓝牙连接状态。
- 各个业务均高度模块化，在深入了解后，可以很方便的拓展。

### 微信小程序官方蓝牙的部分说明：
1. 小程序不会对写入数据包大小做限制，但系统与蓝牙设备会限制蓝牙4.0单次传输的数据大小，超过最大字节数后会发生写入错误，建议每次写入不超过20字节。
2. 若单次写入数据过长，iOS 上存在系统不会有任何回调的情况（包括错误回调）。
3. wx.writeBLECharacteristicValue并行调用多次会存在写失败的可能性。

**所以基于这方面的考虑，本框架有以下约束：**
> 1. 必须按照约定的协议格式来制定协议，才能正常使用该框架。
> 2. 协议一包数据最多20个字节。该框架不支持大于20个字节的协议格式。如果数据超出限制，建议拆分为多次发送。
> 3. 建议以串行方式执行写操作。
> 4. 建议先了解清楚[小程序的官方蓝牙文档](https://developers.weixin.qq.com/miniprogram/dev/api/device/bluetooth-ble/wx.writeBLECharacteristicValue.html)，方便理解框架的使用。

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
                        //发送协议，官方提醒并行调用多次会存在写失败的可能性，所以建议使用串行方式来发送
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
        // closeAll() 会断开蓝牙连接、关闭适配器
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
#### 1. 设置你自己的`setFilter`函数参数、扫描过滤规则(可选)
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
        //setFilter详情见父类
        super.setFilter({
            services: ['0000xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],//必填
            targetServiceArray: [{
                serviceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',//必填
                writeCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxE',//必填
                notifyCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxF',//必填
                readCharacteristicId: '',//非必填
            }],
            targetDeviceName: '目标蓝牙设备的广播数据段中的 LocalName 数据段，如：smart-voice',//非必填，在判断时是用String.prototype.includes()函数来处理的，所以targetDeviceName不必是全称
            scanInterval: 350//扫描周围设备，重复上报的时间间隔，毫秒制，非必填，默认是350ms
        });
        super.initBLEProtocol({bleProtocol: getAppBLEProtocol});
        //setMyFindTargetDeviceNeedConnectedFun函数调用可选，不实现过滤规则框架会按默认规则执行
        super.setMyFindTargetDeviceNeedConnectedFun({
            /**
             * 重复上报时的过滤规则，并返回过滤结果
             * 在执行完该过滤函数，并且该次连接蓝牙有了最终结果后，才会在下一次上报结果回调时，再次执行该函数。
             * 所以如果在一次过滤过程中或是连接蓝牙，耗时时间很长，导致本次连接结果还没得到，就接收到了下一次的上报结果，则会忽略下一次{scanFilterRuler}的执行。
             * 如果不指定这个函数，则会使用默认的连接规则
             * 默认的连接规则详见 lb-ble-common-connection/utils/device-connection-manager.js的{defaultFindTargetDeviceNeedConnectedFun}
             * @param devices {*}是wx.onBluetoothDeviceFound(cb)中返回的{devices}
             * @param targetDeviceName {string}是{setFilter}中的配置项
             * @returns targetDevice 最终返回对象{targetDevice}，是数组{devices}其中的一个元素；{targetDevice}可返回null，意思是本次扫描结果未找到指定设备
             */
            scanFilterRuler: ({devices, targetDeviceName}) => {
                console.log('执行自定义的扫描过滤规则');
                const tempFilterArray = [];
                for (let device of devices) {
                    if (device.localName?.includes(targetDeviceName)) {
                        tempFilterArray.push(device);
                    }
                }
                if (tempFilterArray.length) {
                    const device = tempFilterArray.reduce((pre, cur) => {
                        return pre.RSSI > cur.RSSI ? pre : cur;
                    });
                    return {targetDevice: device};
                }
                return {targetDevice: null};
            }
        })
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
        //发送协议，小程序官方提醒并行调用多次会存在写失败的可能性，所以建议使用串行方式来发送，哪种方式由你权衡
        //但我这里是并行发送了两条0x01和0x02两条协议，仅演示用
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

| 业务 |  对应文件夹 | 示例文件 |
|  ----  | ----   | -----|
| 蓝牙连接 | `lb-ble-common-connection`(连接、断连、重连事件的处理) | `abstract-bluetooth.js`(最简单的、调用平台API的连接、断开蓝牙等处理)<br>`base-bluetooth.js`(记录连接到的设备的deviceId、特征值、连接状态等信息，处理蓝牙数据的发送、蓝牙重连)<br>`base-bluetooth-imp.js`(对蓝牙连接结果的捕获，监听蓝牙扫描周围设备、连接、适配器状态事件并给予相应处理) | * |
| 蓝牙协议的组装 | `lb-ble-common-protocol-body`(实现协议收发格式的组装) | `i-protocol-receive-body.js`<br>`i-protocol-send-body.js` |  
| 蓝牙协议的收发 | `lb-ble-common-protocol-operator`(处理发送数据和接收数据的代理) | `lb-bluetooth-protocol-operator.js` |  
| 蓝牙协议的重发 | `lb-ble-common-connection` | `lb-bluetooth-manager.js`(详见`LBlueToothCommonManager`) |
| 蓝牙状态及协议状态 | `lb-ble-common-state` | `lb-bluetooth-state-example.js`，可额外拓展新的状态 |
| 蓝牙连接和协议状态事件的订阅 | `lb-ble-common-connection/base` | `base-bluetooth-imp.js` |

下面讲下蓝牙连接和协议状态的分发

### 蓝牙连接状态事件的分发
文件位于`lb-ble-common-connection/base/base-bluetooth.js`

1. 某一时刻连接状态改变，将新的状态赋值给`latestConnectState`对象。
2. 触发其`setter`函数`set latestConnectState`。
3. 执行`setter`内部的`_onConnectStateChanged`函数回调。
4. 在`getAppBLEManager.setBLEListener`的`onConnectStateChanged({connectState})`函数中接收到连接状态。


### 蓝牙协议状态事件的分发

`onBLECharacteristicValueChange`位于`lb-ble-common-connection/abstract-bluetooth.js`
`receiveOperation`位于`lb-ble-common-protocol-operator/lb-bluetooth-protocol-operator.js`

在`onBLECharacteristicValueChange`函数中，我在接收到数据后，将数据按`receive-body.js`来截取有效数据，并按`lb-example-bluetooth-protocol.js`中`getReceiveAction`的配置方式来处理有效数据，生产出对应的`value, protocolState`。
`filter`是在接收到未知协议时会生成。
```
 onBLECharacteristicValueChange((res) => {
            console.log('接收到消息', res);
            if (!!valueChangeListener) {
                const {value, protocolState, filter} = this.dealReceiveData({receiveBuffer: res.value});
                !filter && valueChangeListener({protocolState, value});
            }
        });

```

这段代码看起来简单，但背后要经历很多流程。
最关键的是这一行`const {value, protocolState, filter} = this.dealReceiveData({receiveBuffer: res.value});`。
下面我详细的讲一下这一行做了哪些事儿：

1. 执行`dealReceiveData`函数处理协议数据。这里的`dealReceiveData`，最终交由`lb-bluetooth-manager.js`中的`dealReceiveData`函数来处理数据。
2. 在`dealReceiveData`中执行`this.bluetoothProtocol.receive({receiveBuffer})`来生成有效数据和协议状态。这个`receive`最终交由`receiveOperation`函数执行。
3. `receiveOperation`在执行时会引用到`LBlueToothProtocolOperator`的子类的配置项`getReceiveAction`(子类是`lb-example-bluetooth-protocol.js`)。
4. `getReceiveAction`按开发者自己的实现最终返回约定对象`{protocolState,effectiveData}`，该对象返回给`receiveOperation`后进行一次检查（对未在`getReceiveAction`中配置的协议`protocolState`按`CommonProtocolState.UNKNOWN`处理），将该约定对象返回给`dealReceiveData`函数中的局部变量`effectiveData, protocolState`。
5. `protocolState!==CommonProtocolState.UNKNOWN`的对应对象，会被标记为`filter:true`；否则将约定对象返回给`onBLECharacteristicValueChange`函数中的局部变量`value, protocolState`。

以上是这一行代码所做的所有事情。

约定对象，会作为参数传入`valueChangeListener({protocolState, value})`并执行回调。
之后前端就能接收到订阅的事件啦，即在`getAppBLEManager.setBLEListener`的`onReceiveData({protocolState, value})`函数中接收到协议类型和`value`对象。


## LINK

[Document](https://blog.csdn.net/sinat_27612147/article/details/84634432)

[ChangeLog](https://github.com/unmagic/wx-simple-bluetooth/blob/master/log/ChangeLog.md)

[QA](https://github.com/unmagic/wx-simple-bluetooth/blob/master/log/QA.md)

[LICENSE](https://github.com/unmagic/wx-simple-bluetooth/blob/master/LICENSE)

## 交流

技术交流请加QQ群：821711186

## 欢迎打赏

![微信打赏码](https://github.com/unmagic/.gif/blob/master/admire/weixin.png)
![支付宝二维码](https://github.com/unmagic/.gif/blob/master/admire/zhifubao.png)
