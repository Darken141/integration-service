const serverError = (res, err) => {
    console.log(err)

    return res.status(500).json({
        message: 'An unexpected error has occured'
    })
}

module.exports = {
    serverError
}