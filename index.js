import express from 'express'
import cors from 'cors'
import userRoutes from './routes/user.router.js'
import dotenv from 'dotenv'
import db from './utils/db.js'
import cookieParser from 'cookie-parser'

dotenv.config()

const app = express()
const port = process.env.PORT || 4001

app.use(cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
// All routes
app.use("/api/v1/users", userRoutes)

app.get('/', (req, res)=> {
    res.send("Hello world!")
})

// DB connection
db()

app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`)
})