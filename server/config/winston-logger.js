const {createLogger, format, transports} = require('winston');
require('winston-mongodb')

const logger = createLogger({
    transports: [
        new transports.Console({
            level: "info",
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.MongoDB({
            level: "info",
            db: process.env.MONGO_URI,
            options:  { useUnifiedTopology: true },
            collection: "logs",
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.Console({
            level: "error",
            format: format.combine(format.timestamp(), format.json())
        }),
        new transports.MongoDB({
            level: "error",
            db: process.env.MONGO_URI,
            options:  { useUnifiedTopology: true },
            collection: "errors",
            format: format.combine(format.timestamp(), format.json())
        }),
    ]
})

module.exports = logger