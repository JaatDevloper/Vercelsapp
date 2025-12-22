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
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const collection = db.collection('ownerprofile');

    if (req.method === 'GET') {
      const profile = await collection.findOne({});

      if (!profile) {
        return res.status(404).json({ error: 'Owner profile not found' });
      }

      return res.status(200).json({
        _id: profile._id?.toString() || '',
        name: profile.name || '',
        title: profile.title || '',
        imageUrl: profile.imageUrl || '',
        about: profile.about || '',
        skills: profile.skills || [],
        profession: profile.profession || '',
        experience: profile.experience || [],
        socialLinks: profile.socialLinks || {
          behance: '',
          dribbble: '',
          linkedin: '',
          instagram: '',
        },
        achievements: profile.achievements || [],
      });
    }

    if (req.method === 'POST') {
      const { name, title, imageUrl, about, skills, profession, experience, socialLinks, achievements } = req.body || {};

      if (!name) {
        return res.status(400).json({ error: 'Owner name is required' });
      }

      const ownerData = {
        name,
        title: title || '',
        imageUrl: imageUrl || '',
        about: about || '',
        skills: skills || [],
        profession: profession || '',
        experience: experience || [],
        socialLinks: socialLinks || {
          behance: '',
          dribbble: '',
          linkedin: '',
          instagram: '',
        },
        achievements: achievements || [],
        updatedAt: new Date().toISOString(),
      };

      const result = await collection.updateOne(
        {},
        {
          $set: ownerData,
          $setOnInsert: { createdAt: new Date().toISOString() },
        },
        { upsert: true }
      );

      const profile = await collection.findOne({});

      return res.status(200).json({
        _id: profile?._id?.toString() || '',
        name: profile?.name || '',
        title: profile?.title || '',
        imageUrl: profile?.imageUrl || '',
        about: profile?.about || '',
        skills: profile?.skills || [],
        profession: profile?.profession || '',
        experience: profile?.experience || [],
        socialLinks: profile?.socialLinks || {},
        achievements: profile?.achievements || [],
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Owner profile error:', error);
    return res.status(500).json({
      error: 'Failed to process owner profile request',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
