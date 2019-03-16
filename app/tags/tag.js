const _db = require('../db').get('tags_service')

module.exports = class Tag {
  constructor (options) {
    if (options) {
      Object.assign(this, options)
    }
  }

  /**
     * save tag to data store
     * @returns {Object} tag
     */
  async save () {
    await _db.insert(this)
    return this
  }

  /**
     * get tag from dataStore
     * @returns {Object} tag
     */
  static async getTagObject (tagObjectID) {
    let tagObj = await _db.get(tagObjectID)
    return new Tag(tagObj)
  }

  async refresh () {
    let doc = await this.db.get(this._id)
    Object.assign(this, doc)
    return this
  }

  /**
     * create tags function
     * @param {string} tags
     * for each input tag, create array of hierarchical tags
     * creat an id and then add to the data store
     * @returns {Object} tag
     */
  static async createTags (tags) {
    for (let i = 0; i < tags.length; i++) {
      let tag = tags[i]
      do {
        let checkExistTag = await Tag.validOrFindID(tag)
        if (!checkExistTag) {
          let newTag = {
            name: tag
          }
          await _db.insert(newTag)
          tag = tag.substring(0, tag.lastIndexOf('/'))
        } else {
          break
        }
      } while (tag)
    }
  }

  /**
     * get tag and children
     * @param {string} root
     * @returns {Array} tags
     */
  static async getTags (tag) {
    let selector = {}
    if (tag) {
      selector = {
        '$or': [{
          'name': {
            '$eq': tag
          }
        }, {
          '$and': [{
            'name': {
              '$lt': tag + '0'
            }
          },
          {
            'name': {
              '$gte': tag + '/'
            }
          }
          ]
        }]
      }
    } else {
      selector = {
        'name': {
          '$gte': ''
        }
      }
    }
    let body = await _db.find({ selector })
    body = body.docs
    let result = body.map(tag => tag.name)
    return result.sort()
  }

  /**
     * Get ID of name
     * @param {string} root
     * @returns {Array} tags
     */
  static async validOrFindID (tag, option) {
    let selector = {
      'name': tag
    }
    let result = await _db.find({ selector })
    if (result.docs.length === 0) {
      return false
    }
    if (option) {
      return result
    }
    return result.docs[0]._id
  }

  /**
     * from id get to the root
     * @param {String} tagID
     * @returns {String} hierarchical tag
     */
  static async getTagPath (tagID) {
    let doc = await _db.get(tagID)
    return doc.name
  }

  /**
     * rename tag
     * @param {Object} pairs tags
     * recursive to get all the tag under root
     * @returns {Boolean} retun status
     */
  static async renameTags (pairs) {
    for (let ind in pairs) {
      let oldTag = ind.split('/')
      let newTag = pairs[ind].split('/')
      if (oldTag.length !== newTag.length) {
        // key and value are not in the same level
        return false
      }
      let subtree = await Tag.getTags(ind)
      for (let i = 0; i < subtree.length; i++) {
        let subTagDoc = await Tag.validOrFindID(subtree[i], true)
        if (!subTagDoc) {
          return false
        }
        let subTag = new Tag(subTagDoc.docs[0])
        subTag.name = subTag.name.replace(ind, pairs[ind])
        await subTag.save()
      }
    }
    return true
  }

  // No use for now
  // getCountFiles (tag) {
  //   let root = this.root
  //   let rootTag = root
  //   if (util.checkOrFindTag(tag)) {
  //     rootTag = root[this.travelAndUpdate(tag)]
  //   }
  //   let result = {}
  //   let currPath = []
  //   if (rootTag !== root) {
  //     currPath.push(rootTag.tagName)
  //   }
  //   let helper = function (node, currPath, result) {
  //     if (!node.childTags) {
  //       result[currPath.join('/')] = node.assets ? node.assets.length : 0
  //       return result[currPath.join('/')]
  //     }
  //     let count = node.assets ? node.assets.length : 0
  //     node.childTags.forEach(child => {
  //       currPath.push(root[child].tagName)
  //       count += helper(root[child], currPath, result)
  //       currPath.pop()
  //     })
  //     result[currPath.join('/')] = count
  //     return count
  //   }
  //   helper(rootTag, currPath, result)
  //   return result
  // }
}
