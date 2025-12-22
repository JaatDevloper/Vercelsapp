import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "../server/routes";
import type { NextFunction, Request, Response } from "express";
import { createServer } from "node:http";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

function setupCors(app: express.Application) {
  app.use((req, res, next) => {
    // Allow all origins for API calls
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.header("Access-Control-Allow-Headers", "Content-Type, Accept");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  app.use(express.urlencoded({ extended: false }));
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    });

    next();
  });
}

function setupErrorHandler(app: express.Application) {
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    res.status(status).json({ message });
  });
}

// Initialize app only once
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initialized) return;
  
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    setupCors(app);
    setupBodyParsing(app);
    setupRequestLogging(app);

    await registerRoutes(app);

    setupErrorHandler(app);

    initialized = true;
  })();

  return initPromise;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  await initializeApp();
  
  // Create a Node http server and let Express handle the request
  const server = createServer(app);
  
  // Forward the request to Express
  return new Promise<void>((resolve) => {
    server.once("request", app);
    // Call the app with the request and response, then resolve
    app(req as any, res as any);
    
    // Ensure we don't keep the connection open
    res.on("finish", () => {
      resolve();
    });
  });
};
