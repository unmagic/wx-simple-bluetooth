let pages = new Map();


export function notifyBLE({value,name}) {

}

export function registerBLEListener(name, page) {
    pages.set(page.route + '/ble_listener/' + name, page);
}

export function unregisterBLEListener(page, name) {
    pages.delete(page.route + '/ble_listener/' + name);
}
