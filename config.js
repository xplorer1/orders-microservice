module.exports = {
    'port': process.env.PORT || 9000, //
    'baseurl': "",
    'database' : 'mongodb+srv://phantom-admin:Pe4NFrsQFz2Pv2pX@cluster0.08uuj.mongodb.net/ordersdb?retryWrites=true&w=majority',

    'secret': 'hlvsog5NVcZphKxpJPPBBoMww9XRNZ-_h51osqyBqPg',
    'products_service' : "https://product-microservice.herokuapp.com",
    'kafka_client_id' : 'order-products-group'
}