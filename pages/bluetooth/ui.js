import MyBreathBLManager from "../../modules/bluetooth/my-bluetooth-manager";

export default class UI {
    constructor(page) {
        this.stateObj = {};
        this.stateObj[`${MyBreathBLManager.CONNECTED}`] = function () {
            page.setData({
                connectState: MyBreathBLManager.CONNECTED
            });
        };
        this.stateObj[`${MyBreathBLManager.DISCONNECT}`] = function () {
            page.setData({
                connectState: MyBreathBLManager.DISCONNECT
            });
        };
        this.stateObj[`${MyBreathBLManager.UNAVAILABLE}`] = function () {
            page.setData({
                connectState: MyBreathBLManager.UNAVAILABLE
            });
        };
        this.stateObj[`${MyBreathBLManager.CONNECTING}`] = function () {
            page.setData({
                connectState: MyBreathBLManager.CONNECTING
            });
        };
    }

    setState({state}) {
        const fun = this.stateObj[state];
        if (!!fun) {
            fun();
        } else {
            console.log(`目前没有这种状态：${state}`);
        }
    }
}
