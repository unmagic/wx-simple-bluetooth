import {LBlueToothProtocolOperator} from "./lb-ble-common-protocol-operator/index";
import SendBody from "./lb-ble-example-protocol-body/send-body";
import ReceiveBody from "./lb-ble-example-protocol-body/receive-body";
import {ProtocolState} from "./lb-bluetooth-state-example";

/**
 * 蓝牙协议管理类
 * 在这个类中，以配置的方式来编写读操作和写操作
 * 配置方式见下方示例
 */
export default class LBExampleBlueToothProtocol extends LBlueToothProtocolOperator {
    constructor(blueToothManager) {
        super({blueToothManager, protocolSendBody: new SendBody(), protocolReceiveBody: new ReceiveBody()});
    }

    /**
     * 写操作（仅示例）
     */
    getSendAction() {
        return {
            /**
             * 0x01：设置灯色（写操作）
             * @param red 0x00 - 0xff
             * @param green 0x00 - 0xff
             * @param blue 0x00 - 0xff
             * @returns {Promise<void>}
             */
            '0x01': async ({red, green, blue}) => {
                return await this.sendData({command: '0x01', data: [red, green, blue]});
            },

            /**
             * 0x02：设置灯亮度（写操作）
             * @param brightness 灯亮度值 0~100 对应最暗和最亮
             * @returns {Promise<void>}
             */
            '0x02': async ({brightness}) => {
                //data中的数据，填写多少个数据都可以，可以像上面的3位，也可以像这条6位。你只要能保证data的数据再加上你其他的数据，数组总长度别超过20个就行。
                return await this.sendData({command: '0x02', data: [brightness, 255, 255, 255, 255, 255]});
            },

        }
    }

    /**
     * 读操作（仅示例）
     */
    getReceiveAction() {
        return {
            /**
             * 获取设备当前的灯色（读）
             * 可返回蓝牙协议状态protocolState和接收到的数据effectiveData，
             * 该方法的返回值，只要拥有非空的protocolState，该框架便会同步地通知前端同protocolState类型的消息
             * 当然是在你订阅了setBLEListener({onReceiveData})时才会在前端接收到消息。
             */
            '0x10': ({dataArray}) => {
                const [red, green, blue] = dataArray;
                return {protocolState: ProtocolState.RECEIVE_COLOR, effectiveData: {red, green, blue}};
            },
            /**
             * 获取设备当前的灯亮度（读）
             */
            '0x11': ({dataArray}) => {
                const [brightness] = dataArray;
                return {protocolState: ProtocolState.RECEIVE_BRIGHTNESS, effectiveData: {brightness}};
            },
            /**
             * 接收到设备主动发送的灯光关闭消息
             * 模拟的场景是，用户关闭了设备灯光，设备需要主动推送灯光关闭事件给手机
             */
            '0x12': () => {
                //你可以不传递effectiveData
                return {protocolState: ProtocolState.RECEIVE_LIGHT_CLOSE};
            }
        };
    }

    /**
     * 设置灯亮度和颜色
     * @param brightness
     * @param red
     * @param green
     * @param blue
     * @returns {Promise<[unknown, unknown]>}
     */
    async setColorLightAndBrightness({brightness, red, green, blue}) {
        return Promise.all([this.sendAction['0x01']({red, green, blue}), this.sendAction['0x02']({brightness})]);
    }

};

