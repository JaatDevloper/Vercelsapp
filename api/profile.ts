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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const collection = db.collection('appprofile');

    if (req.method === 'GET') {
      const deviceId = req.query.deviceId as string;
      const loginName = req.query.name as string;
      const loginEmail = req.query.email as string;
      const newDeviceId = req.query.newDeviceId as string;

      if (loginName || loginEmail) {
        if (!loginName || !loginEmail) {
          return res.status(400).json({ error: 'Both name and email are required for login' });
        }

        const query = {
          name: { $regex: new RegExp(`^${loginName.trim()}$`, 'i') },
          email: loginEmail.trim().toLowerCase(),
        };

        const profile = await collection.findOne(query);

        if (!profile) {
          return res.status(404).json({ error: 'Profile not found. Please check your name and email match exactly what you used when creating your profile.' });
        }

        if (newDeviceId && newDeviceId !== profile.deviceId) {
          const oldDeviceId = profile.deviceId;
          
          // Update profile with new deviceId
          await collection.updateOne(
            { _id: profile._id },
            { $set: { deviceId: newDeviceId, updatedAt: new Date().toISOString() } }
          );
          
          // Migrate quiz history from old deviceId to new deviceId
          const historyCollection = db.collection('apphistory');
          await historyCollection.updateMany(
            { deviceId: oldDeviceId },
            { $set: { deviceId: newDeviceId } }
          );
          
          profile.deviceId = newDeviceId;
        }

        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.status(200).json({
          _id: profile._id?.toString() || '',
          deviceId: profile.deviceId,
          name: profile.name || '',
          email: profile.email || '',
          avatarUrl: profile.avatarUrl || '',
          income: profile.income || 0,
          expense: profile.expense || 0,
          currency: profile.currency || '$',
          createdAt: profile.createdAt || new Date().toISOString(),
          updatedAt: profile.updatedAt || new Date().toISOString(),
        });
      }

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      const profile = await collection.findOne({ deviceId });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(200).json({
        _id: profile._id?.toString() || '',
        deviceId: profile.deviceId,
        name: profile.name || '',
        email: profile.email || '',
        avatarUrl: profile.avatarUrl || '',
        income: profile.income || 0,
        expense: profile.expense || 0,
        currency: profile.currency || '$',
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: profile.updatedAt || new Date().toISOString(),
      });
    }

    if (req.method === 'POST') {
      const { deviceId, name, email, avatarUrl, income, expense, currency } = req.body || {};

      if (!deviceId) {
        return res.status(400).json({ error: 'Device ID is required' });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }

      await collection.createIndex({ deviceId: 1 }, { unique: true });

      const now = new Date().toISOString();
      const profileData = {
        deviceId,
        name: name.trim(),
        email: email?.trim().toLowerCase() || '',
        avatarUrl: avatarUrl || '',
        income: typeof income === 'number' ? income : 0,
        expense: typeof expense === 'number' ? expense : 0,
        currency: currency || '$',
        updatedAt: now,
      };

      const result = await collection.findOneAndUpdate(
        { deviceId },
        {
          $set: profileData,
          $setOnInsert: { createdAt: now },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );

      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;

      if (!profile) {
        return res.status(500).json({ error: 'Failed to create profile' });
      }

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.status(201).json({
        _id: profile?._id?.toString() || '',
        deviceId: profile?.deviceId,
        name: profile?.name || '',
        email: profile?.email || '',
        avatarUrl: profile?.avatarUrl || '',
        income: profile?.income || 0,
        expense: profile?.expense || 0,
        currency: profile?.currency || '$',
        createdAt: profile?.createdAt || now,
        updatedAt: profile?.updatedAt || now,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({
      error: 'Failed to process profile request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
