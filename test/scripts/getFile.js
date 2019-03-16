const axios = require('axios')
let URL = 'http://localhost:4000/files/'
let file = '108e1eb4f5319d5e07de80943000f22/images.png'
URL = URL + file
axios.get(URL)
  .then(function (response) {
    console.log(response.data);
  })
  .catch(function (error) {
    console.log(error);
  });