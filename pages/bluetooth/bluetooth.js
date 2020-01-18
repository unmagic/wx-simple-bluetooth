import Toast from "../../view/toast";
import UI from './ui';
import {ConnectState} from "../../modules/bluetooth/lb-bluetooth-state-example";
import {getAppBLEProtocol} from "../../modules/bluetooth/lb-example-bluetooth-protocol";
import {getAppBLEManager} from "../../modules/bluetooth/lb-example-bluetooth-manager";

const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        devices: [],
        device: {},
        connectState: ConnectState.UNAVAILABLE
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.ui = new UI(this);
        console.log(app);
        getAppBLEManager.setBLEListener({
            onConnectStateChanged: async (res) => {
                const {connectState} = res;
                console.log('蓝牙连接状态更新', res);
                this.ui.setState({state: connectState});
                switch (connectState) {
                    case ConnectState.CONNECTED:
                        //在连接成功后，紧接着设置灯光颜色和亮度
                        await getAppBLEProtocol.setColorLightAndBrightness({
                            brightness: 100,
                            red: 255,
                            green: 0,
                            blue: 0
                        });

                        break;
                    default:

                        break;
                }

            },

            /**
             * 接收到的蓝牙设备传给手机的有效数据，只包含你最关心的那一部分
             * protocolState和value具体的内容是在lb-example-bluetooth-protocol.js中定义的
             *
             * @param protocolState 蓝牙协议
             * @param value 传递的数据，对应lb-example-bluetooth-protocol.js中的{effectiveData}字段
             */
            onReceiveData: ({protocolState, value}) => {
                console.log('蓝牙协议接收到新的 protocolState:', protocolState, 'value:', value);
            }
        });

        //这里执行连接后，程序会按照你指定的规则（setFilter中指定的），自动连接到距离手机最近的蓝牙设备
        getAppBLEManager.connect();
    },

    /**
     * 断开连接
     * @param e
     * @returns {Promise<void>}
     */
    async disconnectDevice(e) {
        await getAppBLEManager.closeAll();
        this.setData({
            device: {}
        });
        setTimeout(Toast.success, 0, '已断开连接');
    },

    /**
     * 连接到最近的设备
     */
    connectHiBreathDevice() {
        getAppBLEManager.connect();
    },

    async onUnload() {
        await getAppBLEManager.closeAll();
    },
});


