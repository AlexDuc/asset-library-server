const { couchdb } = require('../config')

const nano = exports.nano = require('nano')(couchdb.fullHost)

async function create (name) {
  await nano.db.create(name)
  console.log(`Created the ${name} database!`)

  let db = use(name)
  await db.insert({
    admins: { names: [couchdb.admin.username], roles: [] }
  }, '_security')

  return db
}

function use (name) {
  let db = nano.use(name)
  return db
}

async function exists (name) {
  try {
    await nano.db.get(name)
    return true
  } catch (e) {
    return false
  }
}
// view function on DB, cant use ES6
const tagsFun = function (doc) {
  if (doc.tags.length === 0) return
  doc.tags.forEach(function (tag) {
    emit(tag, doc._id)
  })
}
const metaFun = function (doc) {
  for (var key in doc.metadata) {
    emit([key, doc.metadata[key]], doc._id)
  }
}
// Design document functions

const patchFun = function (doc, req) {
  if (!doc || !req.body) {
    return [null, 'No data']
  }
  var changes = JSON.parse(req.body)
  var fields = []
  for (var key in changes) {
    fields.push(key)
    doc[key] = changes[key]
  }
  doc.modified = Date.now()
  return [doc, 'Updated ' + doc._id + ': ' + fields.join(', ')]
}
const patch = patchFun.toString()
const tags = tagsFun.toString()
const metadata = metaFun.toString()
const DATABASES = {
  assets_service: {
    updates: { patch },
    views: {
      'tagView': {
        map: tags
      },
      'metadata': {
        map: metadata
      }
    },
    indexes: {
      'date': {
        fields: ['date']
      },
      'type': {
        fields: ['type']
      },
      'title': {
        fields: ['title']
      }
    }
  },
  tags_service: {
    updates: { patch },
    indexes: {
      'name': {
        fields: ['name']
      }
    }
  }
}
exports.get = name => use(name)
exports.init = async () => {
  let isNew = true
  for (let name in DATABASES) {
    if (await exists(name)) {
      isNew = false
      continue
    }

    let db = await create(name)
    let { updates, views, indexes } = DATABASES[name]
    if (updates) {
      await db.insert({
        _id: '_design/update',
        updates
      })
    }
    if (views) {
      await db.insert({
        _id: '_design/tag',
        views
      })
    }
    if (indexes) {
      for (let ddoc in indexes) {
        await db.createIndex({
          name: ddoc,
          ddoc,
          index: indexes[ddoc]
        })
      }
    }
  }
  return isNew
}
