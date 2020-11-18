const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const expressLayouts = require('express-ejs-layouts');
const path = require('path')

const bodyParser = require('body-parser')
require('dotenv').config()

// setting up express
const app = express()
app.use(express.json())
app.use(cors())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// setting up mongoose
mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    useCreateIndex: true
}, (err) => {
    if(err) throw err
    console.log('Running. . .')
})

// setting up routes
const userRoute = require('./routes/user-route')
const regRoute = require('./routes/user-route')
app.use('/user', userRoute)
app.use('/reg', regRoute)

//routes
app.use(expressLayouts)
app.set("view engine", "ejs")
app.set("views", path.join(__dirname + "/views"))
app.use(express.static(path.join(__dirname, '/public')))

// assigning port
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
