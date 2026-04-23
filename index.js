const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("This is my AI model inventory server side.");
});

app.listen(port, () => {
  console.log(`Server is runnig on port ${port}`);
});
