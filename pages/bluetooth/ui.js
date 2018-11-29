import BaseBlueToothImp from '../../libs/bluetooth/base/base-bluetooth-imp';

export default class UI {
    constructor(page) {
        this.stateObj = {};
        this.stateObj[`${BaseBlueToothImp.CONNECTED}`] = function () {
            page.setData({
                connectState: BaseBlueToothImp.CONNECTED
            });
        };
        this.stateObj[`${BaseBlueToothImp.DISCONNECT}`] = function () {
            page.setData({
                connectState: BaseBlueToothImp.DISCONNECT
            });
        };
        this.stateObj[`${BaseBlueToothImp.UNAVAILABLE}`] = function () {
            page.setData({
                connectState: BaseBlueToothImp.UNAVAILABLE
            });
        };
        this.stateObj[`${BaseBlueToothImp.CONNECTING}`] = function () {
            page.setData({
                connectState: BaseBlueToothImp.CONNECTING
            });
        };
    }

    setState({state}) {
        this.stateObj[state]();
    }
}
