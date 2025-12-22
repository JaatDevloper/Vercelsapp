import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const collection = db.collection('quizzes');

    // Use aggregation for better performance - don't load full questions array
    const quizzes = await collection.aggregate([
      { $sort: { created_at: -1, timestamp: -1 } },
      {
        $project: {
          _id: 1,
          quiz_id: 1,
          title: 1,
          quiz_name: 1,
          name: 1,
          category: 1,
          timer: 1,
          negative_marking: 1,
          type: 1,
          creator_id: 1,
          creator_name: 1,
          creator: 1,
          created_at: 1,
          timestamp: 1,
          questionCount: { $size: { $ifNull: ["$questions", []] } }
        }
      }
    ]).toArray();

    const formattedQuizzes = quizzes.map((quiz: any) => ({
      _id: quiz._id?.toString() || "",
      quiz_id: quiz.quiz_id || quiz._id?.toString() || "",
      title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
      category: quiz.category || "General",
      timer: quiz.timer || 15,
      negative_marking: quiz.negative_marking || 0,
      type: quiz.type || "free",
      creator_id: quiz.creator_id || "",
      creator_name: quiz.creator_name || quiz.creator || "Unknown",
      created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
      timestamp: quiz.timestamp || quiz.created_at || new Date().toISOString(),
      questionCount: quiz.questionCount || 0,
    }));

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(formattedQuizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    return res.status(500).json({
      error: 'Failed to fetch quizzes',
      message: errorMessage,
      errorType: errorName,
      mongoUriSet: !!process.env.MONGODB_URI,
    });
  }
}
