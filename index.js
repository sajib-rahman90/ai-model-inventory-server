const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hihlt50.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("ai-model-db");
    const modelsCollection = db.collection("models");

    //get modelsCollections data in database.
    app.get("/models", async (req, res) => {
      const result = await modelsCollection.find().toArray();
      res.send(result);
    });

    // create post api for submite add models data on the database
    app.post("/models", async (req, res) => {
      const addData = req.body;
      const result = await modelsCollection.insertOne(addData);
      res.send({
        success: true,
        result,
      });
    });

    //create get api for showing model-details page
    app.get("/models/:id", async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await modelsCollection.findOne({ _id: objectId });

      res.send({
        success: true,
        result,
      });
    });

    //create put api for update model in client server
    app.put("/models/:id", async (req, res) => {
      const { id } = req.params;
      const data = req.body;
      const objectId = new ObjectId(id);
      const filter = { _id: objectId };
      const update = {
        $set: data,
      };
      const result = await modelsCollection.updateOne(filter, update);
      res.send({
        success: true,
        result,
      });
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This is my AI model inventory server side.");
});

app.listen(port, () => {
  console.log(`Server is runnig on port ${port}`);
});
