module.exports.cors = function() {
    /**
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    const handler = function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        next();
    }

    return handler;
}

/**
 * Required the secet key in request, under 'secret-key' header
 * @param {String} key the secret key value
 */
module.exports.HeaderFilter = function(key = '') {
    /**
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/OPTIONS#Preflighted_requests_in_CORS
     */
    const handler = function(req, res, next) {
        res.header('Access-Control-Allow-Headers', 'secret-key, Origin, X-Requested-With, Content-Type, Accept');

        if(req.method === 'OPTIONS' ||  // Preflighted requests in CORS
            req.header('secret-key') === key) {
            next();
        }
        else res.status(403).end();
    }

    return handler;
}