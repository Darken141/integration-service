const mongoose = require('mongoose')

const carrierCodeSchema = mongoose.Schema({
    carrierCodes: {
        type: Object
    }
})

module.exports = mongoose.model("CarrierCode", carrierCodeSchema)