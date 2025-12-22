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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');

    const profileCollection = db.collection('appprofile');
    const quizzesCollection = db.collection('quizzes');
    const roomsCollection = db.collection('approom');
    const historyCollection = db.collection('apphistory');

    // Get total users (unique devices from profiles)
    const totalUsers = await profileCollection.countDocuments();

    // Get total quizzes
    const totalQuizzes = await quizzesCollection.countDocuments();

    // Get total rooms and active rooms
    const totalRooms = await roomsCollection.countDocuments();
    const activeRooms = await roomsCollection.countDocuments({
      status: { $in: ['waiting', 'in_progress'] }
    });

    // Get average score from quiz history
    const scoreAggregate = await historyCollection.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          totalAttempts: { $sum: 1 }
        }
      }
    ]).toArray();

    const scoreData = scoreAggregate[0] || { avgScore: 0, totalAttempts: 0 };

    return res.status(200).json({
      totalUsers,
      totalQuizzes,
      totalRooms,
      activeRooms,
      avgScore: Math.round(scoreData.avgScore * 100) / 100,
      totalAttempts: scoreData.totalAttempts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
