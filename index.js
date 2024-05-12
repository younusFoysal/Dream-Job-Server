const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
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
    ],
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q3baw43.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares
const logger = (req, res, next) => {
    console.log("Log: info", req.method, req.url);
    next();
}

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    //console.log("Token in the middleware", token);
    // no token available
    if (!token){
        return res.status(401).send({message: "unauthorized access"})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err){
            return res.status(401).send({message: "unauthorized access"})
        }
        req.user = decoded;
        next();

    })
    //next();
}

const cookeOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
}



async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        //await client.connect();


        const jobCollection = client.db('jobsDB').collection('job');
        const userCollection = client.db('jobsDB').collection('user');
        const applyCollection = client.db('jobsDB').collection('apply');


        // TODO: Auth JWT token api

        // generates token and sends response api to client as cookie
        app.post('/jwt', logger , async (req, res) => {
            const user = req.body;
            console.log("User for token", user)
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, cookeOption )
            .send({success: true});

        })


        // clears coockie of client side
        app.post('/logout', async (req, res) => {
            const user = req.body;
            console.log('logging out', user)
            res.clearCookie('token', { ...cookeOption, maxAge: 0 }).send({ success: true })
        })

        // require('crypto').randomBytes(64).toString('hex')




        // Todo: Job related APIs
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
        app.get('/mylist/:email', logger, verifyToken, async (req, res) => {
            const email = req.params.email;
            console.log(email)
            // console.log('Cookies: ', req.cookies)
            console.log("Token owner", req.user)

            if ( req.user.email !== email){
                return res.status(403).send({message: 'Forbidden Access'})
            }


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




        // TODO: Applied jobs related apis


        // posting applied job data to DB       puki@puki.com
        app.post('/ajobs', async (req, res) => {
            const newaJob = req.body;
            console.log(newaJob)
            const result = await applyCollection.insertOne(newaJob);

            const id = newaJob.ajid;
            const query = { _id: new ObjectId(id)}
            const plusApplynum = await jobCollection.updateOne( query, { $inc: { appNum: 1 }});
            res.json({ result, plusApplynum });
        })

        // sending db data in json format to show in client side
        app.get('/ajobs', async (req, res) => {
            const cursor = applyCollection.find()
            const result = await cursor.toArray();
            res.send(result)
        })

        // "/mylist/:email" getting specific email job data
        app.get('/myajobs/:email', logger, verifyToken, async (req, res) => {
            const email = req.params.email;
            console.log(email)

            console.log("Token owner", req.user)
            if ( req.user.email !== email){
                return res.status(403).send({message: 'Forbidden Access'})
            }

            const query = {email}
            const cursor = applyCollection.find(query)
            const result = await cursor.toArray();
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