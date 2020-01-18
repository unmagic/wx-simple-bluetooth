import {IBLEProtocolSendBody} from "../lb-ble-common-protocol-body/index";
import {HexTools} from "../lb-ble-common-tool/index";

export default class SendBody extends IBLEProtocolSendBody {

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
