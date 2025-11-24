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

        app.get('/challenges', async (req, res) => {
            const result = await addNewCollection.find().toArray();
            res.send(result);
        })

        app.get('/challenges/:id', async (req, res) => {
            const { id } = req.params;
            console.log(id);

            const result = await addNewCollection.findOne({ _id: new ObjectId(id) })

            res.send({
                success: true,
                result
            })
        })


        app.post('/challenges', async (req, res) => {
            const data = req.body;
            console.log(data);
            const result = await addNewCollection.insertOne(data)
            res.send({
                success: true,
                result
            })
        })

        app.put('/challenges/:id', async (req, res) => {
            const { id } = req.params
            const data = req.body
            // console.log(id)
            // console.log(data)
            const objectId = new ObjectId(id)
            const filter = { _id: objectId }
            const update = {
                $set:data
            }

            const result = await addNewCollection.updateOne(filter, update)

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