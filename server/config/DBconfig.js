const mongoose = require('mongoose')
const CarrierCode = require('../models/carrier-code')
const Order = require('../models/orders')
const logger = require('../config/winston-logger')
const {carrierCodes} = require('../utils/utils')
const {patchOrder, getOrderStatus} = require('../api/api')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true , useUnifiedTopology: true})
const db = mongoose.connection

db.on('error', (error) => console.log(error))
db.on('open', async () => {
    try {
        // Check if have collections with carrier codes
        const isCarriercodeExist = await CarrierCode.exists()
        if(!isCarriercodeExist) {
            //if no, create one
            const newCarrierCodes = new CarrierCode({
                carrierCodes
            })
            await newCarrierCodes.save()
        }

        // Get all orders
        const orders = await Order.find()
        // Check how many of them are incomplete 
        const pendingOrders = orders.filter(order => order.status === 'pending')
        const finishedOrders = orders.filter(order => order.status === 'Finished')
        const sendedOrders = orders.filter(order => order.status === 'sended')

        logger.info({
            message: "Database status",
            pending: pendingOrders.length,
            sended: sendedOrders.length,
            finished: finishedOrders.length
        })

        if(sendedOrders.length > 0) {
            // Get order status every minute
            sendedOrders.forEach(order => {
                getOrderStatus(order.orderId)
                const checkOrderStatus = setInterval(() => {
                    getOrderStatus(order._id, checkOrderStatus)
                }, 60000)
            })
        }

        if(finishedOrders.length > 0) {
            // Get order status every minute
            sendedOrders.forEach(order => {
                patchOrder(order, order.status)
                const updateOrderStatus = setInterval(() => {
                    patchOrder(order, order.status, updateOrderStatus)
                }, 60000)
            })
        }
    } catch(err) {
        logger.error("Database mounting error", err)
    }

    console.log("Connected to Databse")
})