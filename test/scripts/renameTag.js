const axios = require('axios')
let URL = 'http://localhost:4000/tags'
let params = {
  'vehicle': 'transportation'
}
axios.put(URL, params)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
