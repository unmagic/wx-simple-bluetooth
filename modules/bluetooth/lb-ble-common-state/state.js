const CommonConnectState = {
    //蓝牙的常见状态值
    UNBIND: 'unbind',//未绑定
    UNAVAILABLE: 'unavailable',//蓝牙适配器不可用，通常是没有在手机设置中开启蓝牙，或是没有直接或间接调用父类中的openAdapter()
    DISCONNECT: 'disconnect',//蓝牙连接已断开
    CONNECTING: 'connecting',//正在连接蓝牙设备
    CONNECTED: 'connected',//已经正常连接到蓝牙设备
    NOT_SUPPORT: 'not_support',//当前Android系统版本小于4.3
};

const CommonProtocolState = {

    UNKNOWN: 'unknown',//未知状态
    NORMAL_PROTOCOL: 'normal_protocol',//无需处理的协议
    CONNECTED_AND_BIND: 'connected_and_bind',
    QUERY_DATA_START: 'query_data_start',//开始与设备同步数据
    QUERY_DATA_ING: 'query_data_ing',//与设备同步数据状态中
    QUERY_DATA_FINISH: 'query_data_finish',//完成与设备同步数据的状态
    GET_CONNECTED_RESULT_SUCCESS: 'get_connected_result_success',//设备返回连接结果
    SEND_CONNECTED_REQUIRED: 'send_connected_required',//手机发送连接请求
    TIMESTAMP: 'timestamp',//设备获取时间戳
    DORMANT: 'dormant',//设备休眠
    UPDATING: 'updating',//设备升级中
    UPDATE_FINISH: 'update_finish',//设备升级完成
    FIND_DEVICE: 'find_device',//找到了设备
};

export {
    CommonConnectState, CommonProtocolState
}
