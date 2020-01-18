import {LBlueToothManager} from "./lb-ble-common-connection/index";
import LBExampleBlueToothProtocol from "./lb-example-bluetooth-protocol";

/**
 * 蓝牙连接方式管理类
 * 初始化蓝牙连接时需筛选的设备，重写蓝牙连接规则
 */
export const getAppBLEManager = new class extends LBlueToothManager {
    constructor() {
        super();
        this.bluetoothProtocol = new LBExampleBlueToothProtocol(this);
        super.setFilter({
            services: ['00006666-0000-1000-8000-00805F9B34FB'],
            targetServiceArray: [{
                serviceId: '00006666-0000-1000-8000-00805F9B34FB',
                characteristicId: '',
                notify: true,
                read: true,
            }],
            targetDeviceName: 'LB-Light'
        });
    }

    /**
     * 在扫描周围设备时，我们是要以一定规则来找到合适的设备去连接的。
     * 如果你想自己定义这个规则，那么请在此处重写该函数。
     * 在扫描周围设备时，会重复上报同一设备，上报周期350ms。
     * 每个周期内，如果在此处重写该函数，会回调一次该函数。
     * @param devices 该数据格式，是 onBluetoothDeviceFound 中返回的devices
     * @returns {{targetDevice: null}} 返回devices中的一个元素
     */
    overwriteFindTargetDeviceForConnected({devices}) {
        return {targetDevice: devices[0]};
    }

}();
