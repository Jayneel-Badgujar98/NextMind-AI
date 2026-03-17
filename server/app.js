import express from "express" ;
import cors from "cors" ;
import aiRoutes from "./routes/aiRoutes.js"


const app = express() ;

app.use(cors()) ;
app.use(express.json())

app.use("/api/ai", aiRoutes)

app.get("/", (req, res) => {
  res.send("NexMind AI API running")
})

export default app ;




