const express = require("express");
const app = express();
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

//ROUTE IMPORTS
const authRoute = require("./src/routes/auth");

//CONFIGURATION
dotenv.config();

//DATABASE CONNECT
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useCreateIndex: true,
})
.then(() => console.log("Database connected!"))
.catch((err) => console.log(err));

//MIDDLEWARE
app.use(express.json());

//ROUTE MIDDLEWARE
app.use("/api/auth", authRoute);

app.listen(process.env.PORT || 3000, function(){
  console.log(`Server listening on port ${this.address().port} in ${app.settings.env} mode`);
});