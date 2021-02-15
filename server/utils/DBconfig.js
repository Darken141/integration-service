const mongoose = require('mongoose')
const CarrierCode = require('../models/carrier-code')
const {carrierCodes} = require('../utils/utils')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true , useUnifiedTopology: true})
const db = mongoose.connection

db.on('error', (error) => console.log(error))
db.on('open', async () => {
    // Check if have collections with carrier codes
    const isCarriercodeExist = await CarrierCode.exists()
    if(!isCarriercodeExist) {
        //if no, create one
        const newCarrierCodes = new CarrierCode({
            carrierCodes
        })
        await newCarrierCodes.save()
    }

    console.log("Connected to Databse")
})