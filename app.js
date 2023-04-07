require('dotenv').config()
const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended: false}))


app.get('/', (req, res) => {
    res.render('enter')
})

app.listen(8000, () => {
    console.log('Server running on port 8000')
})