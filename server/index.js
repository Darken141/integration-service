const express = require('express')

require('dotenv').config()

// DB connection
require('./utils/DBconfig')

// DB watchers
require('./watcher/order.watcher')

const app = express()
app.use(express.json())

// routers
const apiRouter = require('./routes/api')

app.use('*', (req,res,next) => {
    res.header('Access-Control-Allow-Origin',"*")
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
    res.header('Access-Control-Allow-Headers' ,'*')
    res.header('Access-Control-Expose-Headers', '*')
    next()
})
app.use('/api', apiRouter)

app.get('*', (req, res) => {
    res.status(404).json({
        message: "API route not found"
    })
})

const PORT = 3000 || process.env.PORT
app.listen(PORT, () => {
    console.log(`Server is up and running on port ${PORT}`)
})