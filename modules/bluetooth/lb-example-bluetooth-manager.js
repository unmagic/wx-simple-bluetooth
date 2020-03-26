import {LBlueToothManager} from "./lb-ble-common-connection/index";
import {getAppBLEProtocol} from "./lb-example-bluetooth-protocol";
import {setMyFindTargetDeviceNeedConnectedFun} from "./lb-ble-common-connection/utils/device-connection-manager";

/**
 * 蓝牙连接方式管理类
 * 初始化蓝牙连接时需筛选的设备，重写蓝牙连接规则
 */
export const getAppBLEManager = new class extends LBlueToothManager {
    constructor() {
        super();
        //setFilter详情见
        super.setFilter({
            services: ['0000xxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'],//必填
            targetServiceArray: [{
                serviceId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',//必填
                writeCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxE',//必填
                notifyCharacteristicId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxF',//必填
                readCharacteristicId: '',//非必填
            }],
            targetDeviceName: '目标蓝牙设备的广播数据段中的 LocalName 数据段，如：smart-voice'//非必填
        });
        super.initBLEProtocol({bleProtocol: getAppBLEProtocol});
        // setMyFindTargetDeviceNeedConnectedFun({
        //     connectTargetFun: ({devices}) => {
        //
        //     }
        // })
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
