export default class Toast {

    static success(title, duration) {
        wx.showToast({
            title: title,
            icon: 'success',
            duration: !!duration ? duration : 2000,
        })
    }

    static warn(title, duration) {
        wx.showToast({
            title: title,
            duration: !!duration ? duration : 2000,
            image: '/images/loading_fail.png'
        })
    }

    static showLoading(text) {
        wx.showLoading({
            title: text || '请稍后...',
            mask: true
        })
    }

    static hiddenLoading() {
        wx.hideLoading();
    }

    static hiddenToast() {
        wx.hideToast();
    }
}
