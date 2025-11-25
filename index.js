const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.POST || 3000;

app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ioz0rr9.mongodb.net/?appName=Cluster0`;

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
        await client.connect();


        // Database
        const database = client.db('ecoTrack');
        const addNewCollection = database.collection('add_new_challenges')
        const usersCollection = database.collection('users')
        const joinCollection = database.collection('join_challenge_data')

        // USERS APIs
        app.post('/users', async (req, res) => {
            const newUser = req.body;

            const email = req.body.email;
            const query = { email: email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                res.send({
                    message: "user already exits. Do not need to insert again",
                })
            }
            else {
                const result = await usersCollection.insertOne(newUser);
                res.send(result);
            }
        })

        // Challenge APIs

        // all challenge data
        app.get('/challenges', async (req, res) => {
            const result = await addNewCollection.find().toArray();
            res.send(result);
        })

        // home page latest active challenge from all challenge data
        app.get('/active-challenges', async (req, res) => {
            const cursor = addNewCollection.find().sort({
                createdAt: -1,
                updatedAt: -1,
            }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })

        // challenge details
        app.get('/challenges/:id', async (req, res) => {
            const { id } = req.params;
            console.log(id);
            const result = await addNewCollection.findOne({ _id: new ObjectId(id) })
            res.send({
                success: true,
                result
            })
        })

        // new challenge post create
        app.post('/challenges', async (req, res) => {
            const data = req.body;
            console.log(data);

            // Add timestamps
            data.createdAt = new Date();
            data.updatedAt = new Date();

            const result = await addNewCollection.insertOne(data)
            res.send({
                success: true,
                result
            })
        })

        // update challenge
        app.put('/challenges/:id', async (req, res) => {
            const { id } = req.params
            const data = req.body
            const objectId = new ObjectId(id)
            const filter = { _id: objectId }

            data.updatedAt = new Date();

            const update = {
                $set: data
            }
            const result = await addNewCollection.updateOne(filter, update)
            res.send({
                success: true,
                result
            })
        })


        // USER JOIN CHALLENGE APIs

        // total join
        app.get('/challenges/join-challenge/:challengeId', async (req, res) => {
            const challengeId = req.params.challengeId;
            const query = { challengeId: challengeId }
            const cursor = joinCollection.find(query).sort({ progress: - 1 })
            const result = await cursor.toArray();
            res.send(result);
        })

        // my join


        // new join
        app.post('/join-challenge', async (req, res) => {
            const newJoin = req.body;
            const result = await joinCollection.insertOne(newJoin);
            res.send(result);
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("eco track app server is running")
})


app.listen(port, () => {
    console.log(`eco track app server is running on port: ${port}`)
})