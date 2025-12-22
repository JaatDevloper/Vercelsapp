import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  cachedClient = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  await cachedClient.connect();
  return cachedClient;
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    try {
      const { quizId, hostName } = req.body;

      if (!quizId || !hostName || hostName.trim().length === 0) {
        return res.status(400).json({ error: "Quiz ID and host name are required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      let roomCode = generateRoomCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await roomsCollection.findOne({ roomCode, status: { $ne: "completed" } });
        if (!existing) break;
        roomCode = generateRoomCode();
        attempts++;
      }

      const hostId = `host_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const room = {
        roomCode,
        quizId,
        hostId,
        status: "waiting",
        participants: [{
          odId: hostId,
          name: hostName.trim(),
          isHost: true,
          score: 0,
          correctAnswers: 0,
          finished: false,
          joinedAt: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
      };

      await roomsCollection.createIndex({ roomCode: 1 });
      await roomsCollection.insertOne(room);

      return res.status(201).json({
        roomCode,
        odId: hostId,
        quizId,
        status: "waiting",
        participants: room.participants,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorName = error instanceof Error ? error.name : "UnknownError";
      return res.status(500).json({
        error: "Failed to create room",
        message: errorMessage,
        errorType: errorName,
        mongoUriSet: !!process.env.MONGODB_URI,
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
