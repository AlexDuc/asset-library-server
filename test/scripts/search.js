const axios = require('axios')
let URL = 'http://localhost:4000/files'
let fromdate = new Date('11/21/1987') // some mock date
let toDate = new Date('02/08/2019')
let query = {
  tags: ['example']
  // type: 'image/png',
  // date: {
  //   from: fromdate,
  //   to: toDate
  // },
  // metadata: {
  //   'description': 'Manufactured by XYZ company in 2011.'
  // }
}
if (URL.indexOf('?') === -1) {
  URL = URL + '?params=' + JSON.stringify(query)
} else {
  URL = URL + '&params=' + JSON.stringify(query)
}
axios.get(URL)
  .then(function (response) {
    console.log(response.data)
  })
  .catch(function (error) {
    console.log('something wrong')
    console.log(error)
  })
