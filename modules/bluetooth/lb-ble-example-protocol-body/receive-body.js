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
