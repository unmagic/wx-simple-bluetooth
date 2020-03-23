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
