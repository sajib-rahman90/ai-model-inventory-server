const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceKey.json");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

// Firebase Admin SDK implemantation
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hihlt50.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Firebase Admin SDK verifyToken implemantation
const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized access. Token not found!",
    });
  }
  const token = authorization.split(" ")[1];

  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch (error) {
    res.status(401).send({
      message: "Unauthorized access.",
    });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("ai-model-db");
    const modelsCollection = db.collection("models");
    const purchaseCollection = db.collection("purchases");

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
    app.get("/models/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const objectId = new ObjectId(id);
      const result = await modelsCollection.findOne({ _id: objectId });

      res.send({
        success: true,
        result,
      });
    });

    //create put api for update model in client server
    app.put("/models/:id", verifyToken, async (req, res) => {
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

    //create delete api for delete any model in client server
    app.delete("/models/:id", verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await modelsCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send({
        success: true,
        result,
      });
    });

    //create get api for showing latest model into Home pages in client server
    app.get("/latest-models", async (req, res) => {
      const result = await modelsCollection
        .find()
        .sort({ createdAt: "desc" })
        .limit(6)
        .toArray();

      res.send(result);
    });

    //create get api for showing Users create models into My models pages in client server
    app.get("/my-models", async (req, res) => {
      const email = req.query.email;
      const result = await modelsCollection
        .find({ createdBy: email })
        .toArray();
      res.send(result);
    });

    //create Post api for My Model Purchase pages
    app.post("/purchase/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const existing = await purchaseCollection.findOne({
        modelId: data.modelId,
        purchasedBy: data.purchasedBy,
      });

      if (existing) {
        return res.send({
          success: false,
          message: "You already purchased this model",
        });
      }
      const result = await purchaseCollection.insertOne(data);

      const filter = { _id: new ObjectId(id) };
      const update = {
        $inc: {
          purchased: 1,
        },
      };
      const purchasCounted = await modelsCollection.updateOne(filter, update);
      res.send({
        success: true,
        result,
        purchasCounted,
      });
    });

    //create Get api for My Model Purchase pages
    app.get("/my-purchase", async (req, res) => {
      const email = req.query.email;
      const result = await purchaseCollection
        .find({ purchasedBy: email })
        .toArray();
      res.send(result);
    });

    //create Get api for Search All Model on client servers
    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      const result = await modelsCollection
        .find({ name: { $regex: search_text, $options: "i" } })
        .toArray();
      res.send(result);
    });

    //create Get api for Random Models Slider show on home page
    app.get("/random-models", async (req, res) => {
      const result = await modelsCollection
        .aggregate([{ $sample: { size: 6 } }])
        .toArray();

      res.send(result);
    });

    //create Get api for Filter in All Models
    app.get("/filter", async (req, res) => {
      const { framework } = req.query;
      const query = framework ? { framework } : {};
      const result = await modelsCollection.find(query).toArray();
      res.send(result);
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
