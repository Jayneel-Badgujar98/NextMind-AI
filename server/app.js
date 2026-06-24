import express from "express" ;
import cors from "cors" ;
import cookieParser from "cookie-parser";
import aiRoutes from "./routes/aiRoutes.js"
import chatRoutes from "./routes/chatRoutes.js"
import authRoutes from "./routes/authRoutes.js"

import path from "path";

const app = express() ;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "https://nextmindai.vercel.app"
];

if (process.env.CLIENT_URL) {
  // Normalize the client URL by removing any trailing slash
  const normalizedClientUrl = process.env.CLIENT_URL.replace(/\/$/, "");
  allowedOrigins.push(normalizedClientUrl);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error(`Blocked by CORS: Origin ${origin} not in allowed list:`, allowedOrigins);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
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




