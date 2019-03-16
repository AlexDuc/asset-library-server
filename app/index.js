const app = require('express')()

const host = process.env.HOST || '0.0.0.0'
const port = process.env.PORT || 3000
const dbs = require('./db')
const bodyParser = require('body-parser')
// const Tag = require('./tags/tag')
// let tagObj
async function init () {
  try {
    // create an instance of tag
    if (await dbs.init()) {
      console.log('Created the databases.')
      // tagObj = await Tag.getTagObject(true)
    } else {
      console.log('Databases already created')
      // tagObj = await Tag.getTagObject(false)
    }
  } catch (e) {
    console.error('Errors:', e)
  }
}

init()
  .then(() => {
    app.use(bodyParser.json({ limit: '50mb' }))
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
    // app.use(async (req, res, next) => {
    //   req.tagObj = tagObj
    //   next()
    // })
    // Import API Routes
    app.use('/files', require('./files/routers'))
    app.use('/tags', require('./tags/routers'))
    // Listen the server
    app.listen(port, host, () => {
      console.log('Server listening on ' + host + ':' + port)
    })
  })
