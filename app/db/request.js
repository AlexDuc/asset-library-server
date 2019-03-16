const request = require('request')

const { couchdb } = require('../config')
const { username, password } = couchdb.admin

module.exports = request.defaults({
  auth: {
    user: username,
    pass: password
  }
})
