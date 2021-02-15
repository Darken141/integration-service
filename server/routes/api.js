const express = require('express')
const authenticateToken = require('../midlewares/authenticate-token')
const Order = require('../models/orders')
const router = express.Router()

const {serverError} = require('../utils/errors');

router.post('/orders', authenticateToken, async (req, res) => {
    try {
        const newOrder = new Order({
            orderID: JSON.parse(req.body.resources[0].body.text).id,
            originalOrderData : JSON.stringify(req.body)
        })

        await newOrder.save()
        res.status(200).end()
    } catch (err) {
        serverError(res, err)
    }
})

module.exports = router