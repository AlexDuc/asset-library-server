const axios = require('axios')
let URL = 'http://localhost:4000/files'
const FormData = require('form-data')
const fs = require('fs')

let form = new FormData()
let dirName = './assets/'
let fileName = 'Ending.mp4'
form.append('file', fs.createReadStream(dirName + fileName), {
  filename: fileName
})
let headers = form.getHeaders()
headers.tags = '["vehicle/car", "civilian"]'
headers.metadata = '{"description": "made in 2019"}'
// let headers =  {
//   'Content-Type': 'application/json',
//   "tags": '["vehicle/car", "civilian"]',
//   'metadata': '{"description": "made in 2019"}'
// }
axios.post(URL, form, { headers: headers })
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log(error)
  })
