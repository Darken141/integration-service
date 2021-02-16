const Order = require('../models/orders')
const CarrierCode = require('../models/carrier-code')
const stringSimilarity = require('string-similarity')
const logger = require('../config/winston-logger')
const {codes} = require('iso-country-codes')

const {
    formatOrder,
    checkOrderValidity
} = require('../utils/utils');

const {
    postOrder,
    patchOrder,
    getOrderStatus
} = require('../api/api')

Order.watch().on("change", async (data) => {
    // New order come
    if(data.operationType === 'insert') {
        try {
            logger.info("Get new order")
            const {carrierCodes} = await CarrierCode.findOne()
            // Parse data from database
            const orderData = JSON.parse(data.fullDocument.originalOrderData)
            // Get resources from dataObj
            const orderDetails = JSON.parse(orderData.resources[0].body.text)
            // Find Country code
            const countryObj = codes.find(code => code.name === orderDetails.country)
            // Check carrier codes
            const matches = stringSimilarity.findBestMatch(orderDetails.carrierKey, Object.keys(carrierCodes))
            // Fill orderObj before send
            const orderToSend = formatOrder(orderDetails, data.fullDocument._id, matches, countryObj)
            // Check if have all required properties
            const missingProperties = checkOrderValidity(orderToSend)

            if(missingProperties.length > 0) {
                logger.error("Missing required properties", missingProperties)
            }

            await Order.updateOne({ _id: data.fullDocument._id}, {
                status: "updated",
                orderData: orderToSend,
                missingProperties: missingProperties,
            })
            logger.info(`Order ${data.fullDocument._id} UPDATED`)

        } catch (err) {
            logger.error("SERVER ERROR", err)
        }
    }

    if(data.operationType === 'update') {
        const orderId = data.documentKey._id
        logger.info(`Proccessing updated order: ${orderId} with status: ${data.updateDescription.updatedFields.status}`)

        // If order is send, check status
        if(data.updateDescription.updatedFields.status === 'sended') {
            try {
                // Get order status every minute
                getOrderStatus(orderId)
                const checkOrderStatus = setInterval(() => {
                    getOrderStatus(orderId, checkOrderStatus)
                }, 60000)
            } catch (err) {
                logger.error("SERVER ERROR", err)
            }
        }

        // Order was repaired in database
        if(data.updateDescription.updatedFields.status === 'updated') {
            try {
                // Get order data
                const order = await Order.findById(orderId)
                // Check if have all required properties
                const missingProperties = checkOrderValidity(order.orderData)

                if(missingProperties.length > 0) {
                    logger.error("Missing required properties", ermissingPropertiesr)
                }

                postOrder(order, missingProperties)

            } catch (err) {
                logger.error("SERVER ERROR", err)
            }
        }

        // When order is finished, inform partner
        if(data.updateDescription.updatedFields.status === 'Finished') {
            try {
                const order = await Order.findById(orderId)

                // Get order status every minute
                patchOrder(order, data.updateDescription.updatedFields.status)
                const updateOrderStatus = setInterval(() => {
                    patchOrder(order, data.updateDescription.updatedFields.status, updateOrderStatus)
                }, 60000)

            } catch (err) {
                logger.error("SERVER ERROR", err)
            }
        }
    }
})