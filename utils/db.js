import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

const db = () => {
    mongoose.connect(process.env.MONGO_URL)
        .then(() => console.log("MongoDB is connected"))
        .catch((err) => console.log(err))
}


export default db;
