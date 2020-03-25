import {HexTools} from "../lb-ble-common-tool/index";
import {CommonProtocolState} from "../lb-ble-common-state/index";

const blueToothManager = Symbol("LBlueToothProtocolOperator blueToothManager");
export default class LBlueToothProtocolOperator {

    constructor({protocolSendBody, protocolReceiveBody}) {
        // this._protocolQueue = [];
        this.createBuffer = ({command, effectiveData}) => {
            return protocolSendBody.createBuffer({command, effectiveData});
        };
        this.sendProtocolData = ({command, effectiveData}) => {
            return this[blueToothManager].sendData({buffer: this.createBuffer({command, effectiveData})});
        };
        this.receive = ({receiveBuffer}) => {
            return this.receiveOperation({receiveBuffer, protocolReceiveBody});
        };

        this.receiveAction = this.getReceiveAction();
        this.sendAction = this.getSendAction();
    }

    /**
     * 处理接收的数据，返回截取到的有效数据、及{LBlueToothProtocolOperator}子类中配置的协议状态
     * @param receiveBuffer 从蓝牙底层获取到的蓝牙数据
     * @param protocolReceiveBody
     * @returns {{effectiveData:Array, protocolState: String}|{protocolState: string}} effectiveData 截取到的有效数据 protocolState 配置的协议状态
     */
    receiveOperation({receiveBuffer, protocolReceiveBody}) {
        const receiveArray = [...new Uint8Array(receiveBuffer.slice(0, 20))];
        let command = receiveArray[protocolReceiveBody.commandIndex];
        let commandHex = `0x${HexTools.numToHex(command)}`;
        console.log('[LBlueToothProtocolOperator] the receive data command is:', commandHex);

        const {dataArray} = protocolReceiveBody.getEffectiveReceiveData({receiveArray});

        const doAction = this.receiveAction[commandHex];
        if (doAction) {
            const actionTemp = doAction({dataArray});
            if (actionTemp?.protocolState) {
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

    setBLEManager(manager) {
        this[blueToothManager] = manager;
    }

    /**
     * 清除未发送的蓝牙协议
     */
    // clearSendProtocol() {
    //     let temp;
    //     while ((temp = this._protocolQueue.pop())) {
    //         clearTimeout(temp);
    //     }
    // }

    /**
     * 接收到协议数据后，需要执行的动作
     * 需要在子类中重写，详情见子类示例
     * @returns {{}}
     */
    getReceiveAction() {
        return {};
    }

    /**
     * 发送协议数据时，需要执行的动作
     * 需要在子类中重写，详情见子类示例
     * @returns {{}}
     */
    getSendAction() {
        return {};
    }
}
