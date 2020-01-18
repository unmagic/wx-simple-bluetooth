/**
 * 蓝牙连接及收发数据接口类，只定义接口，需被实现
 */
export default class IBLEOperator {
    /**
     * 处理从连接的蓝牙中接收到的数据
     * 该函数必须在子类中重写！
     * 也千万不要忘了在重写时给这个函数一个返回值，作为处理数据后，传递给UI层的数据
     * 可以参考xxx.类的实现方式
     * @param receiveBuffer 从连接的蓝牙中接收到的数据
     * @returns 传递给UI层的数据
     */
    dealReceiveData({receiveBuffer}) {

    }

    /**
     * 打开蓝牙适配器
     * @returns {Promise<void>}
     */
    async openAdapter() {

    }

    /**
     * 关闭蓝牙适配器
     * @returns {Promise<void>}
     */
    async closeAdapter() {
    }

    /**
     * 建立蓝牙连接
     * @param deviceId
     * @param valueChangeListener
     * @returns {Promise<{serviceId, characteristicId: *, deviceId: *}>}
     */
    async createBLEConnection({deviceId, valueChangeListener}) {
    }

    /**
     * 断开处于连接状态的蓝牙连接
     * @returns {Promise<any>}
     */
    async closeBLEConnection({deviceId}) {
    }

    /**
     * 设置蓝牙扫描和连接时的过滤信息
     * 这会让你在扫描蓝牙设备时，只保留该services数组的蓝牙设备，过滤掉其他的所有设备，提高扫描效率
     * @param services 数组 不被过滤掉的蓝牙设备的广播服务UUID
     * @param targetServiceUUID 目标蓝牙设备用于通信服务的UUID
     */
    setFilter({services, targetServiceUUID}) {
    }

    /**
     * 发送二进制数据
     * @param buffer ArrayBuffer
     * @param deviceId
     * @param serviceId
     * @param characteristicId
     * @returns {Promise<any>}
     */
    async sendData({buffer, deviceId, serviceId, characteristicId}) {
    }


    async startBlueToothDevicesDiscovery() {
    }

    async stopBlueToothDevicesDiscovery() {
    }

    /**
     * 根据 uuid 获取处于已连接状态的设备。
     * @returns {Promise<any>}
     */
    async getConnectedBlueToothDevices() {
    }
}
