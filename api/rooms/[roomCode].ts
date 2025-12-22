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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { roomCode } = req.query;

  if (!roomCode || typeof roomCode !== "string") {
    return res.status(400).json({ error: "Room code is required" });
  }

  try {
    const client = await getMongoClient();
    const db = client.db("quizbot");
    const roomsCollection = db.collection("approom");

    if (req.method === "GET") {
      const room = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      return res.status(200).json({
        roomCode: room.roomCode,
        quizId: room.quizId,
        status: room.status,
        participants: room.participants || [],
        startedAt: room.startedAt,
        completedAt: room.completedAt,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error with room:", error);
    return res.status(500).json({
      error: "Failed to process room request",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
