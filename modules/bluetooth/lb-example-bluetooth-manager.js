import {LBlueToothManager} from "./lb-ble-common-connection/index";
import {getAppBLEProtocol} from "./lb-example-bluetooth-protocol";

/**
 * 蓝牙连接方式管理类
 * 初始化蓝牙连接时需筛选的设备，重写蓝牙连接规则
 */
export const getAppBLEManager = new class extends LBlueToothManager {
    constructor() {
        super();
        super.setFilter({
            services: ['0000180A-0000-1000-8000-00805F9B34FB'],
            targetServiceArray: [{
                serviceId: '6E400001-B5A3-F393-E0A9-E50E24DCCA9F',
                writeCharacteristicId: '6E400002-B5A3-F393-E0A9-E50E24DCCA9F',
                notifyCharacteristicId: '6E400003-B5A3-F393-E0A9-E50E24DCCA9F',
                readCharacteristicId: '',
            }],
            targetDeviceName: 'PB1-'
        });
        super.initBLEProtocol({bleProtocol: getAppBLEProtocol});
    }

    /**
     * 获取本机蓝牙适配器状态
     * @returns {Promise<*>} 返回值见小程序官网 wx.getBluetoothAdapterState
     */
    async getBLEAdapterState() {
        return await super.getBLEAdapterState();
    }

    /**
     * 获取最新的蓝牙连接状态
     * @returns {*}
     */
    getBLELatestConnectState() {
        return super.getBLELatestConnectState();
    }


}();
