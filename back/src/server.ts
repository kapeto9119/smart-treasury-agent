import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { config, validateEnv } from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Validate environment variables
validateEnv();

const app = express();

// Middleware
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", routes);

// Error handling
app.use(errorHandler);

// Start server
const port = config.port;

app.listen(port, () => {
  console.log(`
╔══════════════════════════════════════════╗
║   Smart Treasury Agent API               ║
║   🚀 Server running on port ${port}       ║
║   📊 Environment: ${config.nodeEnv.padEnd(23)}║
║   🔗 http://localhost:${port}              ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
