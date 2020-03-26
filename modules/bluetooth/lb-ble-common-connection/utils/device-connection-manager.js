let findTargetDeviceNeedConnectedFun = defaultFindTargetDeviceNeedConnectedFun;
let scanInterval = 350;

function setMyFindTargetDeviceNeedConnectedFun({scanFilterRuler}) {
    findTargetDeviceNeedConnectedFun = typeof scanFilterRuler === 'function' ? scanFilterRuler : defaultFindTargetDeviceNeedConnectedFun;
}

function setScanInterval(interval) {
    scanInterval = interval ?? 350;
}

/**
 * 默认扫描过滤规则
 * 目的是找到需要连接的蓝牙设备
 * @param devices 一个周期内扫描到的蓝牙设备，周期时长是wx.startBlueToothDevicesDiscovery接口中指定的interval时长
 * @param targetDeviceName 目标设备名称，使用的String.prototype.includes()函数来处理的，所以不必是全称。
 * @returns {{targetDevice: null}|{targetDevice: *}}
 */
function defaultFindTargetDeviceNeedConnectedFun({devices, targetDeviceName}) {
    const tempFilterArray = [];
    for (let device of devices) {
        if (device.localName?.includes(targetDeviceName)) {
            // this._isConnectBindDevice = true;
            tempFilterArray.push(device);
        }
    }
    if (tempFilterArray.length) {
        const device = tempFilterArray.reduce((pre, cur) => {
            return pre.RSSI > cur.RSSI ? pre : cur;
        });
        return {targetDevice: device};
    }
    return {targetDevice: null};
}

export {setMyFindTargetDeviceNeedConnectedFun, setScanInterval, findTargetDeviceNeedConnectedFun, scanInterval};
