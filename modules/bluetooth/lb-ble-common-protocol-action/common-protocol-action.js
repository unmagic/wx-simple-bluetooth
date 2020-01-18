import {HexTools} from "../lb-ble-common-tool/index";
import {Protocol} from "../../network/network/index";
import {CommonConnectState, CommonProtocolState} from "heheda-bluetooth-state";

export default class CommonProtocolAction {
    constructor({lBlueToothProtocolOperatorContext:context}) {
        this.context = context;

        context.requireDeviceBind = () => {
            console.log('发送绑定消息');
            this.context.action['0x01']();
        };

        context.sendQueryDataRequiredProtocol = () => {
            const queryDataTimeoutIndex = setTimeout(() => {
                this.context.action['0x0a']();
            }, 200);
            context._protocolQueue.push(queryDataTimeoutIndex);
        };

        context.sendQueryDataSuccessProtocol = ({isSuccess}) => {
            this.context.action['0x0b']({isSuccess});
        };

        context.startCommunication = () => {
            this.context.action['0x03']();
        };
    }

    getCommonSendActionProtocol() {
        return {
            //由手机发出的连接请求
            '0x01': () => {
                this.context.sendData({command: '0x01'});
            },

            //App发送绑定成功
            '0x03': () => {
                this.context.sendData({command: '0x03'});
            },

            //设备发出待机状态通知
            '0x06': () => {
                this.context.sendData({command: '0x07'});
                return {protocolState: CommonProtocolState.DORMANT};
            },
            //由手机发出的查找设备请求
            '0x08': () => {
                this.context.sendData({command: '0x08'});
            },
            //设备反馈的查找设备结果，找到了设备
            '0x09': () => {
                return {protocolState: CommonProtocolState.FIND_DEVICE};
            },
            //App请求同步数据
            '0x0a': () => {
                this.context.sendData({command: '0x0a'}).then(() => this.context.blueToothManager.executeBLEReceiveDataCallBack({protocolState: CommonProtocolState.QUERY_DATA_START}));
            },

        };
    }
    getCommonReceiveActionProtocol() {
        return {
            //由设备发出的连接反馈 1接受 2不接受 后面的是
            '0x02': ({dataArray}) => {
                const isConnected = HexTools.hexArrayToNum(dataArray.slice(0, 1)) === 1;
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(1));
                console.log('绑定结果', dataArray, deviceId, isConnected);
                //由手机回复的连接成功
                if (isConnected) {
                    Protocol.postDeviceBind({
                        deviceId,
                        mac: this.context.blueToothManager.getDeviceMacAddress()
                    }).then(() => {
                        console.log('绑定协议发送成功');
                        this.context.startCommunication();
                        this.context.blueToothManager.sendQueryDataRequiredProtocol();
                        this.context.blueToothManager.executeBLEReceiveDataCallBack(
                            {protocolState: CommonProtocolState.CONNECTED_AND_BIND},
                        );
                    }).catch((res) => {
                        console.log('绑定协议报错', res);
                        this.context.blueToothManager.updateBLEConnectState({connectState: CommonConnectState.UNBIND});
                    });
                } else {
                    this.context.blueToothManager.clearConnectedBLE();
                }
            },
            //由设备发出的时间戳请求，并隔一段时间发送同步数据
            '0x04': ({dataArray}) => {
                const battery = HexTools.hexArrayToNum(dataArray.slice(0, 1));
                const version = HexTools.hexArrayToNum(dataArray.slice(1, 3));
                const deviceId = HexTools.hexArrayToNum(dataArray.slice(3, 11));
                const now = Date.now() / 1000;
                this.context.sendData({command: '0x05', data: [now]}).then(() => {
                    this.context.sendQueryDataRequiredProtocol();
                });
                return {protocolState: CommonProtocolState.TIMESTAMP, effectiveData: {battery, version, deviceId}};
            },
            //App传给设备同步数据的结果
            '0x0b': ({isSuccess}) => {
                this.context.sendData({
                    command: '0x0b',
                    data: [isSuccess ? 1 : 2]
                });
            },
        }
    }


}
