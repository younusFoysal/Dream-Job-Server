const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');

// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Dream Job server is Running')
})

app.listen(port, () => {
    console.log(`Dream Job server is Running on port: ${port}`)
})