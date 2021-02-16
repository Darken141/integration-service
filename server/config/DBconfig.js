const mongoose = require('mongoose')
const CarrierCode = require('../models/carrier-code')
const Order = require('../models/orders')
const logger = require('../config/winston-logger')
const {carrierCodes, formatOrder, checkOrderValidity} = require('../utils/utils')
const {patchOrder, getOrderStatus, postOrder} = require('../api/api')
const {codes} = require('iso-country-codes')
const stringSimilarity = require('string-similarity')



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
        const recievedOrders = orders.filter(order => order.status === 'recieved')
        const pendingOrders = orders.filter(order => order.status === 'pending')
        const updatedOrders = orders.filter(order => order.status === 'updated')
        const finishedOrders = orders.filter(order => order.status === 'Finished')
        const sendedOrders = orders.filter(order => order.status === 'sended')

        logger.info({
            message: "Database status",
            recieved: recievedOrders.length,
            pending: pendingOrders.length,
            sended: sendedOrders.length,
            finished: finishedOrders.length
        })



        if(recievedOrders.length > 0) {
            
            // Get order status every minute
            recievedOrders.forEach(async(order) => {
                const {carrierCodes} = await CarrierCode.findOne()
                // Parse data from database
                const orderData = JSON.parse(order.originalOrderData)
                // Get resources from dataObj
                const orderDetails = JSON.parse(orderData.resources[0].body.text)
                // Find Country code
                const countryObj = codes.find(code => code.name === orderDetails.country)
                // Check carrier codes
                const matches = stringSimilarity.findBestMatch(orderDetails.carrierKey, Object.keys(carrierCodes))
                // Fill orderObj before send
                const orderToSend = formatOrder(orderDetails, order._id, matches, countryObj)
                // Check if have all required properties
                const missingProperties = checkOrderValidity(orderToSend)

                if(missingProperties.length > 0) {
                    logger.error("Missing required properties", missingProperties)
                }

                await Order.updateOne({ _id: order._id}, {
                    status: "updated",
                    orderData: orderToSend,
                    missingProperties: missingProperties,
                })
                logger.info(`Order ${order._id} UPDATED`)
            })
        }

        if(updatedOrders.length > 0) {
            updatedOrders.forEach(order => {
                // Check if have all required properties
                const missingProperties = checkOrderValidity(order.orderData)

                if(missingProperties.length > 0) {
                    logger.error("Missing required properties", missingProperties)
                }

                postOrder(order, missingProperties)
            })
        }

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
            finishedOrders.forEach(order => {
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