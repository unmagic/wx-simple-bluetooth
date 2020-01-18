import {ConnectState} from "../../modules/bluetooth/lb-bluetooth-state-example";

export default class UI {
    constructor(page) {
        this.stateObj = {};
        this.stateObj[`${ConnectState.CONNECTED}`] = function () {
            page.setData({
                connectState: ConnectState.CONNECTED
            });
        };
        this.stateObj[`${ConnectState.DISCONNECT}`] = function () {
            page.setData({
                connectState: ConnectState.DISCONNECT
            });
        };
        this.stateObj[`${ConnectState.UNAVAILABLE}`] = function () {
            page.setData({
                connectState: ConnectState.UNAVAILABLE
            });
        };
        this.stateObj[`${ConnectState.CONNECTING}`] = function () {
            page.setData({
                connectState: ConnectState.CONNECTING
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
