import mongoose from "mongoose";

const db = mongoose
  .connect(process.env.MONGO_DB || "")
  .then(() => {
    console.log("successfully connected to mongoDB");
  })
  .catch((err) => {
    console.log('error in mongoose config file', err);
  });

  export default db;