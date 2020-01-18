export default class LBlueToothProtocolOperator {

    constructor({blueToothManager, protocolSendBody, protocolReceiveBody}) {
        this._protocolQueue = [];
        this.createBuffer = ({command, data}) => {
            return protocolSendBody.createBuffer({command, data});
        };
        this.sendData = ({command, data}) => {
            return blueToothManager.sendData({buffer: this.createBuffer({command, data})});
        };
        this.receive = ({receiveBuffer}) => {
            return protocolReceiveBody.receive({action: this.receiveAction, receiveBuffer});
        };


        this.receiveAction = this.getReceiveAction();
        this.sendAction = this.getSendAction();
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
