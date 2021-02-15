const carrierCodes = {
    DPD: 1001,
    DHL: 1002,
    "DHL Express": 1003,
    UPS: 1004,
    GLS: 1005,
}

const requiredOrderFields = [
    "OrderID",
    "InvoiceSendLater",
    "Issued",
    "OrderType",
    "Shipping",
]

const requiredShippingFields = [
    "CarrierID",
    "DeliveryAddress",
]

const requiredDeliveryAddressFields = [
    "AddressLine1",
    "City",
    "CountryCode",
    "Email",
    "PersonName",
    "Phone",
    "State",
    "Zip",
]

const requiredProductFields = [
    "Barcode",
    "OPTProductID",
    "Qty",
]

const getBase64Hash = (string) => {
    return new Buffer.from(string).toString('base64')
}

const formatOrder = (order, orderId, carrierMatches, countryObj) => {
    const formatedOrderObj = {
        OrderID: orderId, // required
        InvoiceSendLater: false, // allways false
        Issued: new Date().toISOString(), // required, ISO 8601 date-time format
        OrderType: "standard", // allways "standard",
        Shipping: {
            ...(carrierCodes[carrierMatches.bestMatch.target]) && {CarrierID: carrierCodes[carrierMatches.bestMatch.target]}, // required, mapped from carriers list
            DeliveryAddress: {
                ...(order.addressLine1) && {AddressLine1: order.addressLine1}, // required
                ...(order.AddressLine2) && {AddressLine2: order.AddressLine2}, // optional
                ...(order.city) && {City: order.city}, // required
                ...(order.company) && {Company: order.company}, // optional
                ...(order.country) && {CountryCode: countryObj.alpha2}, // required, ISO 3166-1 alpha-2,
                ...(order.email) && {Email: order.email}, // required
                ...(order.fullName) && {PersonName: order.fullName}, // required
                ...(order.phone) && {Phone: order.phone}, // required
                ...(order.country) && {State: order.country}, // required
                ...(order.zipCode) && {Zip: order.zipCode}, // required
            }
        },
        Products: order.details.map(product => ({
            Barcode: product.eanCode, // required, EAN code
            OPTProductID: product.productId, // required, EAN code
            Qty: product.quantity, // required
        }))
    }
    return formatedOrderObj
}

const checkOrderValidity = (order) => {
    const resultArr = []

    requiredOrderFields.forEach((value) => {
        let result = false

        Object.keys(order).forEach((orderValue) => {
            if(orderValue === value) return result = true
        })
    
        if (result === false) return resultArr.push({
            inside: 'order',
            missing: value,
        })
    })

    requiredShippingFields.forEach((value) => {
        let result = false

        Object.keys(order.Shipping).forEach((shippingValue) => {
            if(shippingValue === value) return result = true
        })
        
        if (result === false) return resultArr.push({
            inside: 'order.Shipping',
            missing: value,
        })
    })

    requiredDeliveryAddressFields.forEach((value) => {
        let result = false

        Object.keys(order.Shipping.DeliveryAddress).forEach((deliveryValue) => {
            if(deliveryValue === value) return result = true
        })
        
        if (result === false) return resultArr.push({
            inside: 'order.Shipping.DeliveryAddress',
            missing: value,
        })
    })

    return resultArr
}

const getConsoleLog = (log, action) => {
    console.log(`----------${action}----------`)
    console.log(log)
    console.log(`----------End of ${action}----------`)
}

module.exports = {
    formatOrder,
    getConsoleLog,
    getBase64Hash,
    checkOrderValidity,
    carrierCodes,
    requiredOrderFields,
    requiredShippingFields,
    requiredProductFields,
    requiredDeliveryAddressFields
}