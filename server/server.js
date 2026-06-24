import "dotenv/config";
import app from "./app.js" 
import connectDB from "./config/db.js";
import { connectRedis } from "./lib/redis.js";

const PORT = process.env.PORT || 3000 ;

// Connect to database
await connectDB()
await connectRedis()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})