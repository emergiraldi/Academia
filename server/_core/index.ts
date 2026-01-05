import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startCronJobs } from "../cron";
import wellhubWebhookRouter from "../wellhubWebhook";
import { initializeAgentWebSocket } from "../agentWebSocket";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Cookie parser middleware - REQUIRED for reading cookies
  app.use(cookieParser());
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Wellhub webhook endpoint
  app.use(wellhubWebhookRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // Start cron jobs for automated notifications
    startCronJobs();

    // Initialize Agent WebSocket Server (for Control ID remote agents)
    const wsPort = parseInt(process.env.AGENT_WS_PORT || "8080");
    try {
      initializeAgentWebSocket(wsPort);
      console.log(`Agent WebSocket Server initialized on port ${wsPort}`);
    } catch (error) {
      console.error('Failed to initialize Agent WebSocket:', error);
    }
  });

  // Handle port already in use error
  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`\n❌ ERROR: Port ${port} is already in use!`);
      console.error(`Please stop the other process or change the PORT in your .env file.\n`);
      process.exit(1);
    } else {
      console.error(`Server error:`, error);
      process.exit(1);
    }
  });
}

startServer().catch(console.error);
