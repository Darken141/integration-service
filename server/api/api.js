const fetch = require('node-fetch')
const Order = require('../models/orders')
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
        console.count(`Count for ${orderId}`)
        getConsoleLog(orderState, "STATUS")

        // When order is done, update status in database
        if(orderState.State === 'Finished') {
            await Order.updateOne({ _id: orderState.OrderID}, {status: "Finished"})
            getConsoleLog(`order ${orderState.OrderID} is finished`, "FINISHED")
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

    getConsoleLog(response.status, "POST /api/orders")

    // Is everything oK?
    if(response.status === 200) {
        await Order.updateOne({ _id: order._id}, {
            status: "sended",
            orderData: order.orderData,
            missingProperties: missingProperties,
        })
        getConsoleLog(`order ${order._id} is sended`, "SUCCESS")
    } else {
        await Order.updateOne({ _id: order._id}, { 
            status: "pending",
            missingProperties: missingProperties,
            orderData: order.orderData
        })
        getConsoleLog(`order ${order._id} failed`, "FAILED")
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

    console.count(`Count for ${order._id}`)

    getConsoleLog(response.status, `REQUEST PATCH /api/orders/${order.orderID}`)

    // Update status when order state is successuly sended
    if(response.status === 200) {
        await Order.updateOne({ _id: order._id}, {status: "Completed"})
        getConsoleLog(`Order ${order._id} is completed`, "COMPLETED")
        clearInterval(updateOrderStatusInterval)
    }
}

module.exports = {
    postOrder,
    patchOrder,
    getOrderStatus
}