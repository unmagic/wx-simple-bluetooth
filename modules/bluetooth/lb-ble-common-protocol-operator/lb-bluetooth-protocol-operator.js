const blueToothManager = Symbol();
export default class LBlueToothProtocolOperator {

    constructor({protocolSendBody, protocolReceiveBody}) {
        this._protocolQueue = [];
        this.createBuffer = ({command, effectiveData}) => {
            return protocolSendBody.createBuffer({command, effectiveData});
        };
        this.sendProtocolData = ({command, effectiveData}) => {
            return this[blueToothManager].sendData({buffer: this.createBuffer({command, effectiveData})});
        };
        this.receive = ({receiveBuffer}) => {
            return protocolReceiveBody.receive({action: this.receiveAction, receiveBuffer});
        };


        this.receiveAction = this.getReceiveAction();
        this.sendAction = this.getSendAction();
    }

    setBLEManager(manager) {
        this[blueToothManager] = manager;
    }

    /**
     * 清除未发送的蓝牙协议
     */
    clearSendProtocol() {
        let temp;
        while ((temp = this._protocolQueue.pop())) {
            clearTimeout(temp);
        }
    }

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
