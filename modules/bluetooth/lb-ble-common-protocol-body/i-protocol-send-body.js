import {HexTools} from "../lb-ble-common-tool/index";

export default class IBLEProtocolSendBody {
    createBuffer({command, effectiveData}) {
        const dataBody = this.createDataBody({command, effectiveData});
        return new Uint8Array(dataBody).buffer;
    }

    // createUpdateBuffer({index, data}) {
    //     const dataBody = createUpdateDataBody({index, data});
    //     return new Uint8Array(dataBody).buffer;
    // }


    /**
     * 生成要发送的蓝牙协议
     * 格式是 [...有效数据前的数据，命令字，...有效数据，...有效数据之后的数据(包括校验位)]
     * 作者处理过的一些协议，是按照这个规则来制定的
     *
     * 该项目暴露的接口运行蓝牙发送协议和接收协议格式不同
     *
     * 关于有效数据前的数据、有效数据等相关的介绍，见 IBLEProtocolReceiveBody类的{getEffectiveReceiveData}函数的相关介绍
     *
     * @param command {String} 命令字
     * @param effectiveData {Array} 要发送的数据(即有效数据)
     * @returns {*[]}
     */
    createDataBody({command = '', effectiveData = []}) {
        return [...this.getDataBeforeCommandData({
            command,
            effectiveData
        }),
            HexTools.hexToNum(command),
            ...effectiveData,
            ...this.getDataAfterEffectiveData({
                command,
                effectiveData
            })];
    }


    /**
     * 命令字之前的数据
     *
     * @param command {String} 命令字
     * @param effectiveData {Array} 有效数据
     * @returns {Array}
     */
    getDataBeforeCommandData({command, effectiveData} = {}) {
        return [];
    }

    /**
     * 获取有效数据之后的数据，包括校验位
     * 校验位的生成自行实现，只需在子类的getDataAfterEffectiveData返回值中加上这一个字节就行了
     * 关于获取有效数据之后的数据相关的介绍，见 IBLEProtocolReceiveBody类的{getEffectiveReceiveData}函数的相关介绍
     *
     * @param command
     * @param effectiveData
     * @returns {Array}
     */
    getDataAfterEffectiveData({command, effectiveData} = {}) {
        return []
    }
}

// function createUpdateDataBody({index, data = []}) {
//     const dataPart = [];
//     data.map(item => HexTools.numToHexArray(item)).forEach(item => dataPart.push(...item));
//     let indexArray = HexTools.numToHexArray(index);
//     indexArray.length === 1 && indexArray.unshift(0);
//     return [170, ...indexArray, ...dataPart];
// }
