const axios = require('axios')
let myURL = 'http://0.0.0.0:4000/files/'
let fromdate = new Date('11/21/1987') // some mock date
let toDate = new Date('02/02/2019')
let query = {
  type: 'image/png',
  date: {
    from: fromdate,
    to: toDate
  }
}
if (myURL.indexOf('?') === -1) {
  myURL = myURL + '?params=' + encodeURIComponent(JSON.stringify(query))
} else {
  myURL = myURL + '&params=' + encodeURIComponent(JSON.stringify(query))
}
axios({
  method: 'get',
  url: myURL
})
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.log(error)
  })
