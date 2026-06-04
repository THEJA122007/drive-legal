import express from "express";
import cors from "cors";

import chatRoutes from "./routes/chatRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import compareRoutes from "./routes/compareRoutes.js";
import checklistRoutes from "./routes/checklistRoutes.js";
import countryRoutes from "./routes/countryRoutes.js";
import violationRoutes from "./routes/violationRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "Drive Legal API"
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/compare", compareRoutes);
app.use("/api/checklist", checklistRoutes);
app.use("/api/country", countryRoutes);
app.use("/api/violation", violationRoutes);

export default app;