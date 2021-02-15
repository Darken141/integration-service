function authenticateToken(req,res, next) {
    const authHeader = req.headers["x-api-key"]
    
    if(authHeader == null) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    if(authHeader !== process.env.KEY1) {
        return res.status(403).json({
            message: "Forbidden"
        })
    }

    if (authHeader === process.env.KEY1) {
        return next()
    }
}

module.exports = authenticateToken