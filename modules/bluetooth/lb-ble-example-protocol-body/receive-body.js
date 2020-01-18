import {IBLEProtocolReceiveBody} from "../lb-ble-common-protocol-body/index";

export default class ReceiveBody extends IBLEProtocolReceiveBody {
    constructor() {
        super({commandIndex: 1, dataStartIndex: 2});
    }

    getEffectiveReceiveDataLength({receiveArray}) {
        return 6;
    }
}
