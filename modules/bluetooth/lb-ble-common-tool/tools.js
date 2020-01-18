export class HexTools {
    /**
     * 将16进制字符串转为十进制数字
     * 如  HexTools.hexToNum('0x11') //17
     *     HexTools.hexToNum('21') //33
     *     HexTools.hexToNum('0xffff') //65535
     *     HexTools.hexToNum('ffff') //65535
     * @param str 可传入16进制的8位或16位字符串
     * @returns {number}
     */
    static hexToNum(str = '') {
        if (str.indexOf('0x') === 0) {
            str = str.slice(2);
        }
        return parseInt(`0x${str}`);
    }

    /**
     * 十进制数字转为8位16进制字符串
     * @param num
     * @returns {string} 得到8位的16进制字符串
     */
    static numToHex(num = 0) {
        return ('00' + num.toString(16)).slice(-2);
    }

    /**
     * hex数组转为num
     * 数组中每一元素都代表一个8位字节，10进制的数字
     * 比如：一个精确到毫秒位的时间戳数组为[ 1, 110, 254, 149, 130, 160 ]，可以用这个函数来处理，得到十进制的时间戳1576229241504
     * 比如：一个精确到秒位的时间戳数组为[ 93, 243, 89, 121 ]，可以用这个函数来处理，得到十进制的时间戳1576229241
     *
     * @param array 按高位在前，低位在后来排列的数组，数组中每一元素都代表一个8位字节，10进制的数字
     * @return {Number}
     */
    static hexArrayToNum(array) {
        let count = 0, divideNum = array.length - 1;
        array.forEach((item, index) => count += item << (divideNum - index) * 8);
        return count;
    }
    /**
     * num转为hex数组
     * 与{hexArrayToNum}含义相反
     * @param num
     * @returns {*} 一个字节代表8位
     */
    static numToHexArray(num) {
        if (num === void 0) {
            return [];
        }
        num = parseInt(num);
        if (num === 0) {
            return [0];
        }
        let str = num.toString(16);
        str.length % 2 && (str = '0' + str);
        const array = [];
        for (let i = 0, len = str.length; i < len; i += 2) {
            array.push(parseInt(`0x${str.substr(i, 2)}`));
        }
        return array;
    }
    /**
     * 获取数据的低八位
     * @param data
     * @returns {{lowLength: number, others: Array}}
     */
    static getDataLowLength({data}) {
        const dataPart = [];
        data.map(item => HexTools.numToHexArray(item)).forEach(item => dataPart.push(...item));
        const lowLength = HexTools.hexToNum((dataPart.length + 1).toString(16));
        return {lowLength, others: dataPart};
    }
}

