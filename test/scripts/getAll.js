const axios = require('axios')
let URL = 'http://localhost:4000/files/listAll'
axios.get(URL)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log('something wrong')
    console.log(error)
  })
