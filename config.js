module.exports = {
    'port': process.env.PORT || 9000, //
    'baseurl': "",
    'database' : 'mongodb+srv://phantom-admin:Pe4NFrsQFz2Pv2pX@cluster0.08uuj.mongodb.net/ordersdb?retryWrites=true&w=majority',

    'secret': 'hlvsog5NVcZphKxpJPPBBoMww9XRNZ-_h51osqyBqPg',
    generateCode: function (len) {
        var length = len,
            charset = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXY",
            retVal = "";
        for (var i = 0, n = charset.length; i < length; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        return retVal;
    },

    validateEmail: function (email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
}