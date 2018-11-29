import HiBreathBLManager from "./hibreath-bluetooth-manager";
import Toast from "../../view/toast";
import BaseBlueToothImp from "../../libs/bluetooth/base/base-bluetooth-imp";
import UI from './ui';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        devices: [],
        device: {},
        connectState: BaseBlueToothImp.UNAVAILABLE
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.ui = new UI(this);
        this.bLEManager = new HiBreathBLManager();
        this.bLEManager.setBLEListener({
            receiveDataListener: ({result}) => {

            },
            bleStateListener: ({state}) => {
                console.log('状态', state);
                this.ui.setState({state});
            }
        });
    },

    disconnectDevice(e) {
        this.bLEManager.disconnect().then(() => {
            this.setData({
                device: {}
            });
            setTimeout(Toast.success, 0, '已断开连接');
        });
    },
    connectHiBreathDevice() {
        this.bLEManager.connect();
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        this.bLEManager.closeAll();
    },
});


