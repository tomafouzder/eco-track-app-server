const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
const app = express();
const port = process.env.POST || 3000;

app.use(cors())
app.use(express.json())

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ioz0rr9.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = async (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        res.status(401).send({
            message: 'unauthorized access. Token not found!'
        })
    }
    const token = authorization.split(' ')[1]

    try {
        await admin.auth().verifyIdToken(token)
        next()
    } catch (error) {
        res.status(401).send({
            message: 'unauthorized access'
        })
    }



}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();


        // Database
        const database = client.db('ecoTrack');
        const addNewCollection = database.collection('add_new_challenges')
        const usersCollection = database.collection('users')
        const joinCollection = database.collection('join_challenge_data')
        const tipsCollection = database.collection('tips')
        const eventCollection = database.collection('events')

        // USERS APIs
        app.post('/users', verifyToken,  async (req, res) => {
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

        // CHALLENGE APIs
        // all challenge data
        app.get('/challenges', async (req, res) => {
            const result = await addNewCollection.find().toArray();
            res.send(result);
        })
        // search
        app.get('/search', async (req, res) => {
            const searchCategory = req.query.search;
            const result = await addNewCollection.find({ category: searchCategory }).toArray()
            res.send(result)
        })
        // my challenge 
        app.get('/my-challenges', verifyToken, async (req, res) => {
            const email = req.query.email;
            const cursor = addNewCollection.find({ createdBy: email });
            const result = await cursor.toArray();
            res.send(result)
        })
        //  active challenge 
        app.get('/active-challenges', async (req, res) => {
            const cursor = addNewCollection.find().sort({
                createdAt: -1,
                updatedAt: -1,
            }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })
        // challenge details 2
        app.get('/challenges/:id', verifyToken, async (req, res) => {
            const { id } = req.params;
            console.log(id);
            const result = await addNewCollection.findOne({ _id: new ObjectId(id) })
            res.send({
                success: true,
                result
            })
        })
        // new challenge post 1 
        app.post('/challenges', verifyToken, async (req, res) => {
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
        // update challenge 5
        app.put('/challenges/:id', verifyToken, async (req, res) => {
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
        // delete my challenge 4
        app.delete('/challenges/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await addNewCollection.deleteOne(query)
            res.send(result)
        })

        // USER JOIN CHALLENGE APIs
        // total join
        app.get('/challenges/join-challenge/:challengeId', verifyToken, async (req, res) => {
            const challengeId = req.params.challengeId;
            const query = { challengeId: challengeId }
            const cursor = joinCollection.find(query).sort({ progress: - 1 })
            const result = await cursor.toArray();
            res.send(result);
        })
        // my join 3
        app.get('/join-challenge', verifyToken, async (req, res) => {
            const email = req.query.email;
            const query = {};
            if (email) {
                query.userId = email;
            }
            const cursor = joinCollection.find(query);
            const result = await cursor.toArray();
            res.send(result)
        })
        // new join 4
        app.post('/join-challenge', verifyToken, async (req, res) => {
            const newJoin = req.body;
            const result = await joinCollection.insertOne(newJoin);
            const filter = { _id: new ObjectId(newJoin.challengeId) }
            const update = {
                $inc: { participants: 1 }
            }
            const participantCount = await addNewCollection.updateOne(filter, update)
            res.send({
                success: true,
                insertedId: result.insertedId,
                participantCount
            });
        })
        // update
        app.put('/join-challenge/:id', verifyToken, async (req, res) => {
            const { id } = req.params
            const data = req.body
            const objectId = new ObjectId(id)
            const filter = { _id: objectId }

            data.updatedAt = new Date();

            const update = {
                $set: data
            }
            const result = await joinCollection.updateOne(filter, update)
            res.send({
                success: true,
                result
            })
        })
        // delete my join 
        app.delete('/join-challenge/:id', verifyToken, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await joinCollection.deleteOne(query)
            res.send(result)
        })

        // TIPS COLLECTION
        // all tips data
        app.get('/tips', async (req, res) => {
            const result = await tipsCollection.find().toArray();
            res.send(result);
        })
        // home page latest resent tips from all tips data
        app.get('/resent-tips', async (req, res) => {
            const cursor = tipsCollection.find().sort({
                createdAt: -1,
            }).limit(6);
            const result = await cursor.toArray();
            res.send(result);
        })
        // post tips apis
        app.post('/tips', async (req, res) => {
            const tips = req.body;
            const result = await tipsCollection.insertOne(tips);
            res.send(result)
        })


        // EVENT APIS
        // all event data
        app.get('/events', async (req, res) => {
            const result = await eventCollection.find().toArray();
            res.send(result);
        })
        // home page upcoming event from 
        app.get('/upcoming-events', async (req, res) => {
            const cursor = eventCollection.find().sort({
                createdAt: -1,
            }).limit(3);
            const result = await cursor.toArray();
            res.send(result);
        })
        // event data post 
        app.post('/events', async (req, res) => {
            const data = req.body;
            console.log(data);

            // Add timestamps
            data.createdAt = new Date();
            data.updatedAt = new Date();

            const result = await eventCollection.insertOne(data)
            res.send({
                success: true,
                result
            })
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