const router = require('express').Router()
const Tag = require('./tag')
module.exports = router

/**
 * create a tag
 * @param {Array} tags
 * create tag from array of input
 * @returns status
 */
router.post('/', async (req, res) => {
  try {
    let tags = req.body.tags
    await Tag.createTags(tags)
    res.sendStatus(200)
  } catch (err) {
    res.sendStatus(400)
  }
})

/**
 * count files
 * NO USE
 * @param {Array} tags
 * @returns {object} file
 */
// router.get('/count', async (req, res) => {
//   try {
//     let tagObj = req.tagObj
//     let result = tagObj.getCountFiles(req.query.root)
//     res.status(200).send(result)
//   } catch (err) {
//     res.sendStatus(400)
//   }
// })

/**
 * rename a tag
 * @param {Object} tags pairs
 * @returns status
 */
router.put('/', async (req, res) => {
  try {
    let rnPairs = req.body
    let result = await Tag.renameTags(rnPairs)
    if (result) {
      res.sendStatus(200)
    } else {
      res.status(400).send('tag not found')
    }
  } catch (err) {
    res.sendStatus(400)
  }
})

/**
 * get all tags
 * @param {string} root
 * @returns {Array} tags
 */

router.get('/', async (req, res) => {
  // get all tags
  try {
    let result = await Tag.getTags(req.query.root)
    if (result) {
      res.status(200).send(result)
    } else {
      res.status(400).send('tag not found')
    }
  } catch (err) {
    res.sendStatus(400)
  }
})
