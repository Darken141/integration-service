const fetch = require('node-fetch')
const Order = require('../models/orders')
const logger = require('../config/winston-logger')
const {
    getConsoleLog,
    getBase64Hash
} = require('../utils/utils')

const getOrderStatus = async (orderId, checkOrderStatusInterval) => {
    const requestOptions = {
        method: 'GET',
        headers: {
            'Authorization': `Basic ${getBase64Hash(`${process.env.USERNAME}:${process.env.PASSWORD}`)}`,
            "Content-Type": "application/json"
        },
        redirect: 'follow'
    };

    const response = await fetch(`${process.env.OP_TIGER_API_ENDPOINT}/api/orders/${orderId}/state`, requestOptions)

    if(response.status === 200) {
        const orderState = await response.json()
        logger.info(orderState)

        // When order is done, update status in database
        if(orderState.State === 'Finished') {
            await Order.updateOne({ _id: orderState.OrderID}, {status: "Finished"})
            logger.info(`Order: ${orderState.OrderID} is finished`)
            clearInterval(checkOrderStatusInterval)
        }
    }
}

const postOrder = async (order, missingProperties) => {
    const raw = JSON.stringify(order.orderData);
    const requestOptions = {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${getBase64Hash(`${process.env.USERNAME}:${process.env.PASSWORD}`)}`,
            "Content-Type": "application/json"
        },
        body: raw,
        redirect: 'follow'
    };

    // Send Order
    const response = await fetch(`${process.env.OP_TIGER_API_ENDPOINT}/api/orders`, requestOptions)

    // Is everything oK?
    if(response.status === 200) {
        await Order.updateOne({ _id: order._id}, {
            status: "sended",
            orderData: order.orderData,
            missingProperties: missingProperties,
        })
        logger.info(`Order: ${order._id} is sended`)
    } else {
        await Order.updateOne({ _id: order._id}, { 
            status: "pending",
            missingProperties: missingProperties,
            orderData: order.orderData
        })
        logger.info(`Order: ${order._id} failed`)
    }
}

const patchOrder = async (order, status, updateOrderStatusInterval) => {
    const raw = JSON.stringify({
        state: status
    });
    const requestOptions = {
        method: 'PATCH',
        headers: {
            'x-api-key': process.env.KEY2,
            "Content-Type": "application/json"
        },
        body: raw,
        redirect: 'follow'
    };

    const response = await fetch(`${process.env.PARTNER_API_ENDPOINT}/api/orders/${order.orderID}`, requestOptions)

    // Update status when order state is successuly sended
    if(response.status === 200) {
        await Order.updateOne({ _id: order._id}, {status: "Completed"})
        logger.info(`Order ${order._id} is completed`)
        clearInterval(updateOrderStatusInterval)
    } else {
        logger.error(`Order: ${order._id} doesnt update state`)
    }
}

module.exports = {
    postOrder,
    patchOrder,
    getOrderStatus
}