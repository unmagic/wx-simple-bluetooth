import {HexTools} from "../lb-ble-common-tool/tools";
import {CommonProtocolState} from "../lb-ble-common-state/state";

/**
 * 蓝牙接收数据后，截取有效数据及自定义的蓝牙协议状态给子类
 */
export default class IBLEProtocolReceiveBody {
    /**
     * @param commandIndex 命令字所在位置的索引
     * @param dataStartIndex 有效数据开始的索引
     */
    constructor({commandIndex, dataStartIndex}) {
        this.commandIndex = commandIndex;
        this.dataStartIndex = dataStartIndex;
    }

    /**
     * 处理接收的数据，返回截取到的有效数据、及{LBlueToothProtocolOperator}子类中配置的协议状态
     * @param action
     * @param receiveBuffer 从蓝牙底层获取到的蓝牙数据
     * @returns {{effectiveData:Array, protocolState: String}|{protocolState: string}} effectiveData 截取到的有效数据 protocolState 配置的协议状态
     */
    receive({action, receiveBuffer}) {
        const receiveArray = [...new Uint8Array(receiveBuffer.slice(0, 20))];
        let command = receiveArray[this.commandIndex];
        let commandHex = `0x${HexTools.numToHex(command)}`;
        console.log('[IBLEProtocolReceiveBody] the receive data command is:', commandHex);

        const {dataArray} = this.getEffectiveReceiveData({receiveArray});

        const doAction = action[commandHex];
        if (doAction) {
            const actionTemp = doAction({dataArray});
            if (actionTemp && actionTemp.protocolState) {
                const {protocolState, effectiveData} = actionTemp;
                return {protocolState, effectiveData};
            } else {
                console.log('接收到的协议已处理完成，因[getReceiveAction]中对应的协议未返回协议状态protocolState，所以本次不通知协议状态');
                return {protocolState: CommonProtocolState.UNKNOWN};
            }
        } else {
            console.warn('接收到的协议无法在[getReceiveAction]中找到对应的协议，可能是您忘记添加了，或是接收到了无效协议，所以本次不通知协议状态');
            return {protocolState: CommonProtocolState.UNKNOWN};
        }
    }

    /**
     * 在接收到的数据中，按你指定的规则获取有效数据
     * 啥叫有效数据，按照我目前制定的协议规则，是这种[...有效数据前的数据，命令字，...有效数据，...有效数据之后的数据(包括校验位)]
     * 发送蓝牙协议也是按照这个规则来制定的。
     * 该项目允许发送协议和接收协议格式不同，因为都暴露出了可拓展的接口，只需继承对应的类，并重写相应函数即可。
     * 一般来说，除有效数据以外的其他数据，对于咱们业务上来说，是没有意义的。
     * 比如：接收到一组获取灯光开关状态和灯光颜色的蓝牙协议 [170(帧头), 10(命令字), 1(灯光开启),255,255,255(三个255,白色灯光),233(协议结束标志，有的协议中没有这一位),18(校验位，我胡乱写的)]
     * 在这一组数据中，跟咱们前端业务有关系的，只有灯光开关状态和灯光颜色[1,255,255,255]，所以我称这一部分为有效数据，该项目文档中其他函数中涉及到有效数据概念的，都是这个意思。
     *
     * 此例更多的说明：有效数据前的数据[170] 有效数据之后的数据[233,18]
     *
     * 在这个函数中可以看到调用了{getEffectiveReceiveDataLength}，说明有效数据的字节长度是必须要生成的，你需要在{getEffectiveReceiveDataLength}中写死或是动态计算出有效数据的字节长度。
     * 多说一句，在这条协议中，233是结束标志，如果你在制定协议时，有结束标志，那么需要在{getEffectiveReceiveDataLength}中动态计算出有效数据的字节长度，计算结果是4。
     * 如果不需要结束标志，也可以这样：在有效数据前的数据中，可以放置一个字节，代表有效数据的字节长度，这样{getEffectiveReceiveDataLength}中直接获取到这一位数并返回就行啦。
     * 方案是有很多种的，这里仅是提供思路。
     *
     * @param receiveArray {Array} 程序接收到蓝牙发送的所有数据
     * @returns {{dataArray: Array}}
     */
    getEffectiveReceiveData({receiveArray}) {
        let effectiveReceiveDataLength = this.getEffectiveReceiveDataLength({receiveArray}), dataArray = [];
        if (effectiveReceiveDataLength > 0) {
            const endIndex = this.dataStartIndex + effectiveReceiveDataLength;
            dataArray = receiveArray.slice(this.dataStartIndex, endIndex);
        }
        return {dataArray};
    }

    /**
     * 获取有效数据的字节长度
     * 有效数据字节长度是指，在协议中由你的业务规定的具有特定含义的值的总字节长度
     * 更多的说明，以及该长度的计算规则示例，见 IBLEProtocolReceiveBody 类的 {getEffectiveReceiveData}函数
     *
     * @param receiveArray 接收到的一整包数据
     * @returns {number} 有效数据的字节长度
     */
    getEffectiveReceiveDataLength({receiveArray}) {
        return 0;
    }
}


