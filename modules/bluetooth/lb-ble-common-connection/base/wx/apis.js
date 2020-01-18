export function createBLEConnection({deviceId, timeout}) {
    return new Promise((resolve, reject) => wx.createBLEConnection({
        deviceId,
        timeout,
        success: resolve,
        fail: reject
    }));
}

export function closeBLEConnection({deviceId}) {
    return new Promise((resolve, reject) => wx.closeBLEConnection({deviceId, success: resolve, fail: reject}));
}

export function writeBLECharacteristicValue({deviceId, serviceId, characteristicId, value}) {
    return new Promise((resolve, reject) => wx.writeBLECharacteristicValue({
        ...arguments[0],
        success: resolve,
        fail: reject
    }));
}

export function readBLECharacteristicValue({deviceId, serviceId, characteristicId}) {
    return new Promise((resolve, reject) => wx.readBLECharacteristicValue({
        serviceId, deviceId, characteristicId,
        success: resolve,
        fail: reject
    }));
}

export function getBLEDeviceServices({deviceId}) {
    return new Promise((resolve, reject) => wx.getBLEDeviceServices({
        deviceId, success: res => {
            const {services} = res;
            console.log('device services:', services);
            resolve({services});
        }, fail: reject
    }));
}

export function getBLEDeviceCharacteristics({deviceId, serviceId}) {
    return new Promise((resolve, reject) => wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: res => {
            const {characteristics} = res;
            console.log('device getBLEDeviceCharacteristics:', characteristics);
            resolve({characteristics, serviceId});
        },
        fail: reject
    }));
}

export function startBlueToothDevicesDiscovery({services, allowDuplicatesKey, interval}) {
    return new Promise((resolve, reject) => wx.startBluetoothDevicesDiscovery({
        ...arguments[0],
        success: resolve,
        fail: reject
    }));
}

export function stopBlueToothDevicesDiscovery() {
    return new Promise((resolve, reject) => wx.stopBluetoothDevicesDiscovery({success: resolve, fail: reject}));
}

export function openBlueToothAdapter() {
    let isBugPhone = false;
    try {
        const {model} = wx.getSystemInfoSync();
        isBugPhone = model.indexOf('iPhone 6') !== -1 || model.indexOf('iPhone 7') !== -1;
    } catch (e) {
        console.error('wx.getSystemInfoSync() error', e);
    }
    return (openBlueToothAdapter = function () {
        return new Promise((resolve, reject) => {
            if (!isBugPhone) {
                wx.openBluetoothAdapter({success: resolve, fail: reject});
            } else {
                setTimeout(() => {
                    wx.openBluetoothAdapter({success: resolve, fail: reject});
                }, 150);
            }
        });
    })();


}

export function closeBlueToothAdapter() {
    return new Promise((resolve, reject) => wx.closeBluetoothAdapter({success: resolve, fail: reject}));
}

export function getConnectedBlueToothDevices({services}) {
    return new Promise((resolve, reject) => wx.getConnectedBluetoothDevices({
        services,
        success: resolve,
        fail: reject
    }));
}

export function onBLECharacteristicValueChange(cb) {
    wx.onBLECharacteristicValueChange(cb);
}

/**
 * 获取在蓝牙模块生效期间所有已发现的蓝牙设备。包括已经和本机处于连接状态的设备
 * @returns {Promise<any>}
 */
export function getBlueToothDevices() {
    return new Promise((resolve, reject) => wx.getBluetoothDevices({success: resolve, fail: reject}));
}

export function getBlueToothAdapterState() {
    return new Promise((resolve, reject) => wx.getBluetoothAdapterState({success: resolve, fail: reject}));
}

export function notifyBLECharacteristicValueChange({deviceId, serviceId, characteristicId, state}) {
    return new Promise((resolve, reject) => wx.notifyBLECharacteristicValueChange({
        deviceId, serviceId, characteristicId, state,
        success: resolve,
        fail: reject
    }));
}

/**
 * 注册读写notify监听，该事件要发生在连接上设备之后
 * @param deviceId 已连接的设备id
 * @param targetServiceUUID 目标蓝牙服务UUID
 * @returns {Promise<{serviceId, characteristicId: *, deviceId: *}>}
 */
export async function notifyBLE({deviceId, targetServiceUUID}) {
    // const {characteristics, serviceId} = findTargetServiceByUUID({deviceId, targetServiceUUID});
    const {characteristics, serviceId} = await findTargetServiceByUUID({deviceId, targetServiceUUID});
    let read = -1, notify = -1, write = -1, characteristicId = '';
    for (let i = 0, len = characteristics.length; i < len; i++) {
        let item = characteristics[i], properties = item.properties, uuid = item.uuid;
        if (notify === -1 && (properties.notify || properties.indicate)) {
            await notifyBLECharacteristicValueChange({deviceId, serviceId, characteristicId: uuid, state: true});
            console.warn('已注册notify事件 characteristicId:', uuid);
            notify = i;
        }
        if (read === -1 && (properties.read)) {
            read = i;
            await readBLECharacteristicValue({deviceId, serviceId, characteristicId: uuid});
            console.warn('本次读特征值是 characteristicId:', uuid);
        }
        if (write !== i && write === -1 && properties.write) {
            write = i;
            characteristicId = uuid;
            console.warn('本次写特征值是 characteristicId:', characteristicId);
        }
    }
    return {serviceId, characteristicId};
}


export function setStorageSync(key, data) {
    wx.setStorageSync(key, data);
}

export function getStorageSync(key) {
    return wx.getStorageSync(key);
}

export function removeStorageSync(key) {
    return wx.removeStorageSync(key);
}

export function onBluetoothAdapterStateChange(cb) {
    wx.onBluetoothAdapterStateChange(cb);
}

export function onBLEConnectionStateChange(cb) {
    wx.onBLEConnectionStateChange(cb);
}

export function onBluetoothDeviceFound(cb) {
    wx.onBluetoothDeviceFound(cb);
}

async function findTargetServiceByUUID({deviceId, targetServiceUUID}) {
    const {services} = await getBLEDeviceServices({deviceId});
    for (const {isPrimary, uuid} of services) {
        if (isPrimary && uuid.toUpperCase() === targetServiceUUID) {
            console.log('即将建立通信的服务uuid:', uuid);
            return await getBLEDeviceCharacteristics({deviceId, serviceId: uuid});
        }
    }
}

