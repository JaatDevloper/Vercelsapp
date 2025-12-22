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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { roomCode } = req.query;
  const { odId, score, correctAnswers, totalQuestions } = req.body;

  if (!roomCode || typeof roomCode !== "string") {
    return res.status(400).json({ error: "Room code is required" });
  }

  try {
    const client = await getMongoClient();
    const db = client.db("quizbot");
    const roomsCollection = db.collection("approom");

    const room = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    await roomsCollection.updateOne(
      { 
        roomCode: roomCode.toUpperCase(),
        "participants.odId": odId
      },
      { 
        $set: { 
          "participants.$.score": score,
          "participants.$.correctAnswers": correctAnswers,
          "participants.$.totalQuestions": totalQuestions,
          "participants.$.finished": true,
          "participants.$.finishedAt": new Date().toISOString()
        } 
      }
    );

    const updatedRoom = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });
    const allFinished = updatedRoom?.participants?.every((p: any) => p.finished);

    if (allFinished) {
      await roomsCollection.updateOne(
        { roomCode: roomCode.toUpperCase() },
        { $set: { status: "completed", completedAt: new Date().toISOString() } }
      );
    }

    return res.status(200).json({ 
      success: true, 
      allFinished,
      participants: updatedRoom?.participants || [],
    });
  } catch (error) {
    console.error("Error submitting result:", error);
    return res.status(500).json({
      error: "Failed to submit result",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
