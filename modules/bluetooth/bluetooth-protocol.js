const commandIndex = 4, dataStartIndex = 5;

const deviceIndexNum = 6;
export default class BlueToothProtocol {
    static TIMESTAMP = 'timestamp';//开始预热状态
    static PRE_HOT_START = 'pre_hot_start';//开始预热状态
    static PRE_HOT_FINISH_AND_START_BREATH = 'pre_hot_finish_and_start_breath';//预热完成开始吹气
    static BREATH_FINISH_AND_SUCCESS = 'breath_finish_and_success';//吹气完成返回结果
    static BREATH_RESTART = 'breath_restart';//重新吹气
    static DEVICE_ID_REQUIRE = 'device_id_require';//app请求设备串号
    static DEVICE_ID_GET_SUCCESS = 'device_id_get_success';//设备成功返回串号
    static UNKNOWN = 'unknown';//未知状态

    constructor(blueToothManager) {
        this.action = {
            //由设备发出的时间戳请求
            '0x70': () => {
                const now = Date.now() / 1000;
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x71', data: now})});
                return {state: BlueToothProtocol.TIMESTAMP};
            },
            //由设备发出的预热请求
            '0x72': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x73'})});
                return {state: BlueToothProtocol.PRE_HOT_START};
            },
            //由设备发出的吹气请求
            '0x74': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x75'})});
                return {state: BlueToothProtocol.PRE_HOT_FINISH_AND_START_BREATH};
            },
            //由设备发出的重新吹气请求
            '0x76': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x77'})});
                return {state: BlueToothProtocol.BREATH_RESTART};
            },
            //由设备发出的显示结果请求
            '0x78': ({dataArray}) => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x79'})});
                return {state: BlueToothProtocol.BREATH_FINISH_AND_SUCCESS, dataAfterProtocol: dataArray};
            },
            //由App发出的串号请求
            '0x7A': () => {
                blueToothManager.sendData({buffer: this.createBuffer({command: '0x7A'})});
                return {state: BlueToothProtocol.DEVICE_ID_REQUIRE};
            },
            //由设备发出的串号反馈
            '0x7B': ({dataArray}) => {
                return {state: BlueToothProtocol.DEVICE_ID_GET_SUCCESS, dataAfterProtocol: dataArray};
            },
        }
    }

    requireDeviceId() {
        this.action['0x7A']();
    }

    receive({receiveBuffer}) {
        const receiveArray = [...new Uint8Array(receiveBuffer)];
        let command = receiveArray[commandIndex];
        let commandHex = `0x${BlueToothProtocol.numToHex(command)}`;
        let dataLength = receiveArray[2] - 2;
        let dataArray;
        if (dataLength > 0) {
            const endIndex = dataStartIndex + dataLength;
            dataArray = receiveArray.slice(dataStartIndex, endIndex + 1);
        }
        console.log('16进制的命令字', commandHex, receiveArray);
        const action = this.action[commandHex];
        if (action) {
            return action({dataArray});
        } else {
            return {state: BlueToothProtocol.UNKNOWN};
        }
    }


    createBuffer({command, data}) {
        const dataBody = this.createDataBody({command, data});
        return new Uint8Array(dataBody).buffer;
    }

    createDataBody({command = '', data}) {
        const dataPart = BlueToothProtocol.numToHexArray(data);
        const lowLength = BlueToothProtocol.hexToNum((dataPart.length + 2).toString(16));
        console.log(BlueToothProtocol.hexToNum(command), command, '发送的命令字');
        const array = [170, 0, lowLength, deviceIndexNum, BlueToothProtocol.hexToNum(command), ...dataPart];
        let count = 0;
        array.forEach(item => count += item);
        count = ~count + 1;
        array.push(count);
        return array;
    }

    static hexToNum(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`);
    }

    static numToHex(num = 0) {
        return ('00' + num.toString(16)).slice(-2);
    }

    static numToHexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }
        let str = num.toString(16);
        console.log('num转为hex', str);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(parseInt(`0x${str.substr(i, 2)}`));
        }
        return array;
    }
}
