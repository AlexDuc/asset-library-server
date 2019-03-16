const router = require('express').Router()
const File = require('./file')
const util = require('../utils')
const fs = require('fs-extra')
const Busboy = require('busboy')
const dir = 'download'
const Tag = require('../tags/tag')
const sharp = require('sharp')
const _db = require('../db').get('assets_service')
module.exports = router

const debug = (message, reject) => err => {
  console.error(message, err)
  reject(err)
}
/**
     * Upload a file
     * @param {String} tags
     * @param {String} metadata
     * @param {binary} file
     * get array of id base on input tags
     * save metadata and tag to db => get id of doc
     * attach the file data as stream to database
     * @returns {object} file
     */
router.post('/', util.middleware(
  req => new Promise(async (resolve, reject) => {
    let inputTags = JSON.parse(req.headers.tags)
    let description = req.headers.description
    let busboy = new Busboy({ headers: req.headers })
    let tags = []
    // get array of id base on input tags
    let validTag = true
    for (let i = 0; i < inputTags.length; i++) {
      let inputTag = inputTags[i]
      let checkTagExist = await Tag.validOrFindID(inputTag)
      if (checkTagExist) {
        tags.push(checkTagExist)
      } else {
        validTag = false
      }
    }
    if (validTag) {
      let file
      busboy.on('file', async (fieldName, stream, filename, encoding, contentType) => {
        // validate file name
        filename = util.validateFilename(filename)
        try {
          // save metadata and tag to db => get id of doc
          file = await File.create({
            tags,
            description,
            title: filename,
            type: contentType
          })
          // attach the file data as stream to database
          await file.addAttachment(stream, filename, contentType)
          await file.refresh()
          var fullUrl = req.protocol + '://' + req.get('host') + '/files/' + file._id + '/' + file.title
          await file.addMetadata(fullUrl)
          resolve(file)
        } catch (err) {
          debug('error upload', reject)
        }
      })
      busboy.on('error', debug('busboy error', reject))
      req.pipe(busboy)
    } else {
      debug('tag not found', reject)
    }
  })
))

/**
 * dowload a file
 * @param {String} id
 * @param {String} file name
 * @returns {binary} file
 */
router.get('/download/:id/:file', async (req, res) => {
  let id = req.params.id
  let fileName = req.params.file
  let file = await File.find({
    _id: id,
    title: fileName
  })
  let path = `${dir}/${fileName}`
  await file.getAttachment(fs.createWriteStream(path))
  res.download(path)
})

/**
 * get binary of a file as stream
 * @param {String} id
 * @param {String} file name
 * @returns {binary} file
 */

router.get('/:id/thumbnail', async (req, res) => {
  // return thumbnail file
  let id = req.params.id
  let file = await File.find({
    _id: id
  })
  if (file.type.includes('image')) {
    const transformer = sharp()
      .resize({ width: 100 })
      .png()
    let stream = await file.getAttachment(transformer)
    stream.pipe(res)
  } else if (file.type.includes('video')) {
    if (!file._attachments['thumbnail.png']) {
      var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl.replace('thumbnail', file.title)
      let pathToSnapshot = './download/' + file.title + '_tn.png'
      require('child_process').exec(('ffmpeg -i ' + fullUrl + ' -vframes 1 -s 320x240 -ss 02 ' + pathToSnapshot), function () {
        console.log('Processing finished !')
        fs.readFile(pathToSnapshot, (err, data) => {
          if (!err) {
            _db.attachment.insert(file._id, 'thumbnail.png', data, 'image/png', { rev: file._rev }).then(async (body) => {
              fs.unlink(pathToSnapshot)
              await file.getAttachment(res, 'thumbnail.png')
            })
          }
        })
      })
    } else {
      await file.getAttachment(res, 'thumbnail.png')
    }
  } else {
    res.status(400).send('File type not supported')
  }
})

router.get('/:id/:file', async (req, res) => {
  // return binary file streamed
  let id = req.params.id
  let fileName = req.params.file
  let file = await File.find({
    _id: id,
    title: fileName
  })
  await file.getAttachment(res)
})

/**
 * search
 * @param {String} parameters includes (tags, date range, type and metadata)
 * @returns {object} array of files
 */
router.get('/', async (req, res) => {
  // search
  try {
    let params = JSON.parse(req.query.params)
    let arrayFiles = []
    let files = await File.search(Tag, params)
    if (!files) {
      return res.status(400).send('tag not found')
    }
    arrayFiles = await Promise.all(files.map(async (file) => {
      file.tags = await Promise.all(file.tags.map(async (tag) => Tag.getTagPath(tag)))
      return file
    }))
    res.status(200).send(arrayFiles)
  } catch (err) {
    res.status(400).send(err)
  }
})

/**
 * change tags and metadata an asset
 * @param {String} id
 * @param {Object} patch (tag, metadata)
 * @returns {Object} updated file
 */

router.put('/:id', async (req, res) => {
  try {
    let id = req.params.id
    let patch = req.body
    let file = await File.find({
      _id: id
    })
    await file.updateAnAsset(Tag, patch)
    res.status(200).send(await file.serialize(Tag))
  } catch (err) {
    console.error(' error', err)
    res.status(400)
  }
})

/**
 * change tags and metadata of assets
 * @param {Object} patch (ids, tag, metadata)
 * @returns {Array} list of updated file
 */
router.put('/', async (req, res) => {
  try {
    let patch = req.body
    let files = []
    if (patch.ids) {
      await patch.ids.forEach(async (id) => {
        let file = await File.find({
          _id: id
        })
        await file.updateAnAsset(Tag, patch)
        files.push(await file.serialize(Tag))
      })
    }
    res.status(200).send(files)
  } catch (err) {
    console.error(' error', err)
    res.status(400)
  }
})
