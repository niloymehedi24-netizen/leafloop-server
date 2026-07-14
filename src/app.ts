import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: ["https://leafloop.vercel.app"], // <-- PUT YOUR REAL VERCEL URL HERE
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("LeafLoop Server is running...");
});

export default app;
