import express from "express";
import cors from "cors";
import "dotenv/config";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import { clerkMiddleware } from "@clerk/express";
import workspaceRouter from "./routes/workspaceRoutes.js";
import { protect } from "./middleware/authMiddleware.js";

const app = express();

app.use(express.json());
app.use(cors()); //Parses all requests from different origins
app.use(clerkMiddleware());

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.use("/api/inngest", serve({ client: inngest, functions }));

app.use("/api/workspaces", protect, workspaceRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
