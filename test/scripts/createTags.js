const axios = require('axios')
let URL = 'http://localhost:4000/tags'
let params = {
  tags: ['example']
}
axios.post(URL, params)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
