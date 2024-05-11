const express = require('express')
const cors = require('cors')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');


// middleware
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://dream-job-36fe2.web.app",
        "https://dream-job-36fe2.firebaseweb.app"
    ]
}))
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3baw43.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();


        const jobCollection = client.db('jobsDB').collection('job')
        const userCollection = client.db('jobsDB').collection('user');



        // Todo: Jov related APIs
        // posting job data to DB
        app.post('/job', async (req, res) => {
            const newJob = req.body;
            console.log(newJob)
            const result = await jobCollection.insertOne(newJob)
            res.send(result)
        })

        // sending db data in json format to show in client side
        app.get('/job', async (req, res) => {
            const cursor = jobCollection.find()
            const result = await cursor.toArray();
            res.send(result)
        })

        // finding job to update the data in db
        app.get('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await jobCollection.findOne(query)
            res.send(result)
        })

        // updating job in DB
        app.put('/job/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)}
            const options = { upsert: true }
            const updatedJob = req.body;
            const job = {
                $set: {
                    jobURL: updatedJob.jobURL,
                    title: updatedJob.title,
                    category: updatedJob.category,
                    salary: updatedJob.salary,
                    details: updatedJob.details,
                    ddate: updatedJob.ddate,
                    appNum: updatedJob.appNum,
                    pdate: updatedJob.pdate,
                    visitors: updatedJob.visitors,
                    email: updatedJob.email,
                    name: updatedJob.name

                }
            }

            const result = await jobCollection.updateOne(filter, job, options )
            res.send(result)
        })


        // getting specific category job data ----- category
        app.get('/jobcategory/:category', async (req, res) => {
            const category = req.params.category;
            const query = {category}
            const cursor = jobCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        })

        // "/mylist/:email" getting specific email job data
        app.get('/mylist/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email}
            const cursor = jobCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        })

        // deleting job in DB
        app.delete('/job/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await jobCollection.deleteOne(query)
            res.send(result)
        })




        // Todo: User related APIs

        // posting user data to DB-user-table
        app.post('/user', async (req, res) => {
            const user = req.body
            console.log(user)
            const result = await userCollection.insertOne(user)
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        //await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Dream Job server is Running')
})

app.listen(port, () => {
    console.log(`Dream Job server is Running on port: ${port}`)
})