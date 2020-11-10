const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

// setting up express
const app = express()
app.use(express.json())
app.use(cors())

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
app.use('/user', userRoute)


// assigning port
const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
