import MyBlueToothManager from "../../modules/bluetooth/my-bluetooth-manager";
import Toast from "../../view/toast";
import UI from './ui';

const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        devices: [],
        device: {},
        connectState: MyBlueToothManager.UNAVAILABLE
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        this.ui = new UI(this);
        // this.bLEManager = new MyBlueToothManager();
        //这里我没有设置scanBLEListener，开启扫描后，程序会自动连接到距离手机最近的蓝牙设备
        console.log(app);
        app.setBLEListener({
            receiveDataListener: ({finalResult, state}) => {
                //这里的finalResult是经过dealReceiveData({result})处理后得到的结果
                //state为接收到数据时的状态

            },
            bleStateListener: ({state}) => {
                //常见的蓝牙连接状态见MyBreathBLManager
                console.log('状态', state);
                this.ui.setState({state});
            },
            // scanBLEListener: ({devices}) => {
            //     //devices是蓝牙模块生效期间所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备
            // }
        });
    },

    /**
     * 断开连接
     * @param e
     */
    disconnectDevice(e) {
        app.getBLEManager().closeAll().then(() => {
            this.setData({
                device: {}
            });
            setTimeout(Toast.success, 0, '已断开连接');
        });
    },
    /**
     * 扫描
     */
    connectHiBreathDevice() {
        app.getBLEManager().connect();
    },
    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {
        app.getBLEManager().closeAll();
    },
});


