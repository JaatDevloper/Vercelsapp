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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const collection = db.collection('apphistory');

    if (req.method === 'GET') {
      const deviceId = req.query.deviceId as string;

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      // Look up user's profile to get their name and email
      const profileCollection = db.collection('appprofile');
      const profile = await profileCollection.findOne({ deviceId });

      // Build query to find history by deviceId OR by userName/userEmail
      let query: any = { deviceId };
      
      if (profile && (profile.name || profile.email)) {
        query = {
          $or: [
            { deviceId },
            ...(profile.name && profile.email ? [{ 
              userName: { $regex: new RegExp(`^${profile.name}$`, 'i') },
              userEmail: profile.email.toLowerCase()
            }] : []),
            ...(profile.email ? [{ userEmail: profile.email.toLowerCase() }] : [])
          ]
        };
      }

      const history = await collection
        .find(query)
        .sort({ completedAt: -1 })
        .toArray();

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json(history.map(item => ({
        id: item._id?.toString() || item.id || '',
        deviceId: item.deviceId,
        quizId: item.quizId || '',
        quizTitle: item.quizTitle || '',
        score: item.score || 0,
        totalQuestions: item.totalQuestions || 0,
        correctAnswers: item.correctAnswers || 0,
        completedAt: item.completedAt || new Date().toISOString(),
      })));
    }

    if (req.method === 'POST') {
      const { deviceId, quizId, quizTitle, score, totalQuestions, correctAnswers, completedAt } = req.body || {};

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      if (!quizId || !quizTitle) {
        return res.status(400).json({ error: 'Quiz ID and title are required' });
      }

      const profileCollection = db.collection('appprofile');

      await collection.createIndex({ deviceId: 1 });
      await collection.createIndex({ deviceId: 1, completedAt: -1 });

      // Look up the user's profile to get reliable name, email, and avatarUrl
      const profile = await profileCollection.findOne({ deviceId });
      
      // Use profile data if available, otherwise fall back to client-provided data
      const userName = profile?.name || req.body?.userName || '';
      const userEmail = profile?.email || req.body?.userEmail || '';
      const userAvatarUrl = profile?.avatarUrl || req.body?.userAvatarUrl || '';
      const profileId = profile?._id?.toString() || '';

      const historyItem = {
        deviceId,
        quizId,
        quizTitle,
        score: typeof score === 'number' ? score : 0,
        totalQuestions: typeof totalQuestions === 'number' ? totalQuestions : 0,
        correctAnswers: typeof correctAnswers === 'number' ? correctAnswers : 0,
        completedAt: completedAt || new Date().toISOString(),
        userName,
        userEmail,
        userAvatarUrl,
        profileId,
      };

      const result = await collection.insertOne(historyItem);

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(201).json({
        id: result.insertedId.toString(),
        ...historyItem,
      });
    }

    if (req.method === 'DELETE') {
      const deviceId = req.query.deviceId as string;

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      const result = await collection.deleteMany({ deviceId });

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('History API error:', error);
    return res.status(500).json({
      error: 'Failed to process history request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
