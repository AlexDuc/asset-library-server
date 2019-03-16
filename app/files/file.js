const _db = require('../db').get('assets_service')
const ffprobe = require('ffprobe')
const ffprobeStatic = require('ffprobe-static')
module.exports = class File {
  constructor (options) {
    if (options) {
      Object.assign(this, options)
    }
  }
  async refresh () {
    let doc = await _db.get(this._id)
    Object.assign(this, doc)
    return this
  }
  /**
         * save file to database
         * @returns {Object} doc file
         */
  async save () {
    this.date = Date.now()
    let body = await _db.insert(this)
    if (body.ok) {
      this._rev = body.rev
      this._id = body.id
    }
    return this
  }

  /**
     * get a file from database
     * @param {Object} selector
     * @returns {Object} doc file
     */
  static async find (selector) {
    let files = await _db.find({
      selector
    })
    if (files) {
      return new File(files.docs[0])
    }
    return false
  }
  static async create (data) {
    return new File(data).save()
  }

  /**
     * format output of file
     * @param {Object} tagObj
     * get the tags based on tag iD
     * @returns {Object} file
     */
  async serialize (tagObj) {
    // export
    // let tags = []

    // for (let i = 0; i < this.tags.length; i++) {
    //   tags.push(await tagObj.getTagPath(this.tags[i]))
    // }
    return {
      ...this,
      tags: await Promise.all(this.tags.map(async (tag) => tagObj.getTagPath(tag))),
      raw: '/files/' + this._id + '/' + this.title,
      thumbnail: '/files/' + this._id + '/thumbnail'
    }
  }

  /**
     * get an attachment
     * @param {Object} stream
     * @returns stream file binary
     */
  getAttachment (stream, filename) {
    let fname = filename || this.title
    if (stream) {
      return new Promise((resolve, reject) => {
        let readable = _db.attachment.getAsStream(this._id, fname)
        readable.on('end', () => {
          stream.end()
          resolve(stream)
        })
        readable.on('error', (err) => {
          console.log('error', err)
          stream.destroy()
          reject(err)
        })
        readable.pipe(stream, { end: false })
      })
    } else {
      return _db.attachment
        .get(this._id, fname)
    }
  }
  async addMetadata (URL) {
    ffprobe(URL, { path: ffprobeStatic.path })
      .then(async (info) => {
        this.metadata = info.streams[0]
        await this.save()
        return this
      })
      .catch(function (err) {
        console.error(err)
      })
  }
  /**
         * add an attachment to database as stream
         * @param {Object} stream file name
         * @returns status
         */
  addAttachment (stream, filename, contentType, fullURL) {
    return new Promise((resolve, reject) => {
      stream.pipe(_db.attachment.insertAsStream(
        this._id,
        filename,
        null,
        contentType, { rev: this._rev }).on('end', () => {
        resolve(stream)
      }))
    })
  }

  /**
     * find all file based on tagas
     * @param {Object} tags
     * @returns {Array} files
     */
  static async search (tagObj, input) {
    let selector = {}
    if (input) {
      selector = {
        '$and': [{
          _id: {
            '$gte': null
          }
        }]
      }
      if (input.tags) {
        let inputtags = input.tags
        for (let j = 0; j < inputtags.length; j++) {
          let fullTagTree = await tagObj.getTags(inputtags[j])
          if (!fullTagTree) {
            return false
          }
          let orTags = {
            '$or': []
          }
          let tagsID = await Promise.all(fullTagTree.map(async (tag) => tagObj.validOrFindID(tag)))
          orTags.$or = tagsID.map(tagID => {
            return {
              'tags': {
                '$elemMatch': {
                  '$eq': tagID
                }
              }
            }
          })
          selector.$and.push(orTags)
        }
      }

      if (input.type) {
        let type = {
          type: input.type
        }
        selector.$and.push(type)
      }

      if (input.date) {
        if (input.date.from) {
          let date = {
            date: {
              '$gte': Date.parse(input.date.from)
            }
          }
          selector.$and.push(date)
        }
        if (input.date.to) {
          let date = {
            date: {
              '$lte': Date.parse(input.date.to)
            }
          }
          selector.$and.push(date)
        }
      }
      if (input.title || input.name) {
        let title = input.title || input.name
        title = title.split(' ').join('.*')
        title = '(?i)' + '^.*' + title + '.*$'
        let titleSelect = {
          title: {
            '$regex': title
          }
        }
        selector.$and.push(titleSelect)
      }
      if (input.metadata) {
        let meta = {
          metadata: {}
        }
        for (let ind in input.metadata) {
          meta.metadata[ind] = input.metadata[ind]
        }
        selector.$and.push(meta)
      }
    }
    let files = await _db.find({
      selector,
      fields: ['_id', 'title', 'date', 'type', 'tags', 'metadata', 'description'],
      sort: [{ 'date': 'desc' }],
      limit: input.paging.limit,
      skip: input.paging.skip
    })
    files = files.docs
    return files
  }

  // /**
  //  * find all files based on metadata
  //  * @param {Object} inputMeta
  //  * @returns {Array} files
  //  */
  // static async findAllMeta (inputMeta) {
  //   let results = []
  //   for (let ind in inputMeta) {
  //     let key = ind
  //     let value = inputMeta[ind]
  //     let listFiles = []
  //     let docs = await _db.view('metadata', 'metadata', {
  //       'key': [key, value],
  //       'include_docs': true
  //     })
  //     if(docs.rows.length > 0) {
  //       let files = docs.rows
  //       listFiles = listFiles.concat(files.map(file => file.doc))
  //     }
  //     listFiles = util.uniqueArray(listFiles)
  //     results = (results.length === 0) ? listFiles : util.getCommonItemsArrays(results, listFiles)
  //   }
  //   return results
  // }

  /**
     * Update metadata and tags
     * @param {Object} patch
     * @returns {Object} updated file
     */
  async updateAnAsset (tagObj, patch) {
    // add
    if (patch.add) {
      for (let ind in patch.add) {
        if (ind === 'tags') {
          for (let i = 0; i < patch.add.tags.length; i++) {
            let tag = patch.add.tags[i]
            let id = await tagObj.validOrFindID(tag)
            let index = this.tags.indexOf(id)
            if (index < 0) {
              this.tags.push(id)
            }
          }
        } else {
          this.metadata[ind] = patch.add[ind]
        }
      }
    }
    // del
    if (patch.del) {
      for (let ind in patch.del) {
        if (ind === 'tags') {
          for (let i = 0; i < patch.del.tags.length; i++) {
            let tag = patch.del.tags[i]
            let id = await tagObj.validOrFindID(tag)
            let index = this.tags.indexOf(id)
            if (index >= 0) {
              this.tags.splice(index, 1)
            }
          }
        } else {
          if (this.metadata[ind] !== undefined) {
            delete this.metadata[ind]
          }
        }
      }
    }
    // set
    if (patch.set) {
      for (let ind in patch.set) {
        if (ind === 'tags') {
          for (let oldTag in patch.set.tags) {
            let oldID = await tagObj.validOrFindID(oldTag)
            let newID = await tagObj.validOrFindID(patch.set.tags[oldTag])
            let index = this.tags.indexOf(oldID)
            if (index >= 0) {
              this.tags[index] = newID
            }
          }
        } else {
          if (this.metadata[ind] !== undefined) {
            this.metadata[ind] = patch.set[ind]
          }
        }
      }
    }
    await this.save()
  }
}
