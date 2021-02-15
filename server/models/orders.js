const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    orderID: {
        type: String,
    },
    status: {
        type: String,
        default: "recieved",
        required: true
    },
    missingProperties: [{
        type: Object,
    }],
    orderData: {
        type: Object
    },
    originalOrderData: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: new Date()
    }
})

module.exports = mongoose.model("Order", orderSchema)