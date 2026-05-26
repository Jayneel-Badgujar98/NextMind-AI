import express from "express" ;
import cors from "cors" ;
import cookieParser from "cookie-parser";
import aiRoutes from "./routes/aiRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import authRoutes from "./routes/authRoutes.js"

import path from "path";

const app = express() ;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
})) ;
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes)
app.use("/api/ai", aiRoutes)
app.use("/api/chats", chatRoutes)

app.get("/", (req, res) => {
  res.send("NexMind AI API running")
})

export default app ;




