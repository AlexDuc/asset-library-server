const axios = require('axios')
let URL = 'http://localhost:4000/tags'
let root = ''
URL = URL + '?root=' + root
axios.get(URL)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
