const btoa = require('btoa')
const atob = require('atob')
exports.imageFilter = (req, file, cb) => {
  // accept image only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    req.fileValidationError = 'Only image file are allowed!'
    return cb(null, false, req.fileValidationError)
  }
  cb(null, true)
}
exports.makeid = len => {
  let length = len || 6
  let text = Math.random().toString(36).slice(-length)
  return text
}
// validate filename: replace all invalid characters by underscore
exports.validateFilename = filename =>
  filename.replace(/[^\w.-]/g, '_')

exports.middleware = (handler) =>
  async (req, res, next) => {
    if (handler) {
      try {
        let body = await handler(req)
        res.status(200).json(body)
      } catch (err) {
        res.status(400).send(err)
      }
    }
  }
