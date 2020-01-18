import {CommonConnectState, CommonProtocolState} from "./lb-ble-common-state/index";

const ProtocolState = {
    ...CommonProtocolState,
    RECEIVE_COLOR: 'receive_color',//获取到设备的颜色值
    RECEIVE_BRIGHTNESS: 'receive_brightness',//获取到设备的亮度
    RECEIVE_LIGHT_CLOSE: 'receive_close',//获取到设备灯光关闭事件
};

export {
    ProtocolState, CommonConnectState as ConnectState
};
