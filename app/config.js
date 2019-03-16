let couchdb = {
  secure: false,
  hostname: process.env.DB_HOST || 'localhost',
  admin: {
    username: 'admin',
    password: 'admin'
  }
}

let protocol = couchdb.secure ? 'https' : 'http'
let port = couchdb.port || (couchdb.secure ? 6984 : 5984)
couchdb.host = `${couchdb.hostname}:${port}`
couchdb.baseURL = `${protocol}://${couchdb.host}/`
couchdb.fullHost = `${protocol}://${couchdb.admin.username}:${couchdb.admin.password}@${couchdb.host}`
module.exports = { couchdb }
