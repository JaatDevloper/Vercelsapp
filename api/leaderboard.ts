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

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const timeFilter = req.query.filter as string || 'allTime';
    
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const historyCollection = db.collection('apphistory');

    let dateFilter = {};
    const now = new Date();
    
    if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      dateFilter = { completedAt: { $gte: startOfDay.toISOString() } };
    } else if (timeFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { completedAt: { $gte: startOfMonth.toISOString() } };
    }

    const leaderboardData = await historyCollection.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$deviceId',
          totalPoints: { $sum: '$score' },
          totalQuizzes: { $sum: 1 },
          totalCorrect: { $sum: '$correctAnswers' },
          totalQuestions: { $sum: '$totalQuestions' },
          userName: { $last: '$userName' },
          userEmail: { $last: '$userEmail' },
          userAvatarUrl: { $last: '$userAvatarUrl' },
        },
      },
      {
        $addFields: {
          // Calculate average score percentage (0-100)
          avgScorePercent: {
            $cond: {
              if: { $gt: ['$totalQuestions', 0] },
              then: { $multiply: [{ $divide: ['$totalCorrect', '$totalQuestions'] }, 100] },
              else: 0
            }
          },
          // Composite ranking score: combines quiz count with accuracy
          // Formula: (avgScorePercent * 0.6) + (min(totalQuizzes, 50) * 0.8)
          // This rewards both high accuracy AND consistent participation
          rankingScore: {
            $add: [
              { $multiply: [
                { $cond: {
                  if: { $gt: ['$totalQuestions', 0] },
                  then: { $divide: ['$totalCorrect', '$totalQuestions'] },
                  else: 0
                }},
                60
              ]},
              { $multiply: [{ $min: ['$totalQuizzes', 50] }, 0.8] }
            ]
          }
        }
      },
      // Sort by ranking score (best performers first)
      { $sort: { rankingScore: -1, totalQuizzes: -1, totalPoints: -1 } },
      { $limit: 50 },
      {
        $lookup: {
          from: 'appprofile',
          localField: '_id',
          foreignField: 'deviceId',
          as: 'profileData'
        }
      },
      {
        $unwind: {
          path: '$profileData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          deviceId: '$_id',
          totalPoints: 1,
          totalQuizzes: 1,
          totalCorrect: 1,
          totalQuestions: 1,
          avgScorePercent: 1,
          rankingScore: 1,
          userName: 1,
          userEmail: 1,
          userAvatarUrl: 1,
          profileName: '$profileData.name',
          profileEmail: '$profileData.email',
          profileAvatarUrl: '$profileData.avatarUrl'
        }
      }
    ]).toArray();

    const leaderboard = leaderboardData.map((entry: any, index: number) => {
      const name = entry.profileName || entry.userName || 'Anonymous';
      const email = entry.profileEmail || entry.userEmail || '';
      
      return {
        id: entry.deviceId || `user-${index}`,
        name,
        username: email ? email.split('@')[0] : 'player',
        email,
        avatarUrl: entry.profileAvatarUrl || entry.userAvatarUrl || '',
        points: entry.totalPoints || 0,
        quizzesTaken: entry.totalQuizzes || 0,
        correctAnswers: entry.totalCorrect || 0,
        totalQuestions: entry.totalQuestions || 0,
        avgScorePercent: Math.round(entry.avgScorePercent || 0),
        rankingScore: Math.round((entry.rankingScore || 0) * 10) / 10,
        rank: index + 1,
      };
    });

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
