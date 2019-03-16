const axios = require('axios')
let URL = 'http://localhost:4000/files'
let id = '22de465dcc39157da98f2620d301a833'
let params = {
  'del': {
    'tags': ['civilian']
  },
  'set': {
    'description': 'Manufactured by XYZ company in 2000.'
  }
}
URL = URL + '/' + id
axios.put(URL, params)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
