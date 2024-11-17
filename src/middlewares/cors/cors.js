const config = require('./../../app/config/config')

module.exports = () => {
  return (req, res, next) => {
    const allowedOrigins = config.ALLOWED_ORIGINS
    const origin = req.headers.origin
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*')
    }
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT',
      'DELETE',
      'PATCH'
    )
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')

    if (req.method == 'OPTIONS') {
      res.append('Access-Control-Max-Age', 600)
    }

    next()
  }
}
