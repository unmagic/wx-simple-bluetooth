import {IBLEProtocolSendRuler} from "../lb-ble-common-protocol-ruler/index";
import {HexTools} from "../lb-ble-common-tool/index";


/**
 * 蓝牙协议发送体示例
 * 该框架的蓝牙协议是按照约定格式来制定的
 * 发送协议格式示例：110(帧头)、10(命令字)、255、255、255(这三个255是蓝牙设备设置灯光的有效数据位)、13(校验位，这个13是我随便写的)
 */
export default class SendRuler extends IBLEProtocolSendRuler {

    getDataBeforeEffectiveData({command, effectiveData} = {}) {
        //有效数据前的数据 该示例只返回了帧头110
        return [110];
    }

    getDataAfterEffectiveData({command, effectiveData} = {}) {
        //协议结束标志
        const endFlag = 233;
        //该示例中checkSum的生成规则是计算协议从第0个元素累加到结束标志
        let checkSum = endFlag + HexTools.hexToNum(command);
        for (let item of this.getDataBeforeEffectiveData()) {
            checkSum += item;
        }
        for (let item of effectiveData) {
            checkSum += item;
        }
        //生成有效数据之后的数据
        return [endFlag, checkSum];
    }
}
