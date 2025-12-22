import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient, ObjectId } from 'mongodb';

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Quiz ID is required' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('quizbot');
    const collection = db.collection('quizzes');

    let quiz = null;

    quiz = await collection.findOne({ _id: id as any });

    if (!quiz && ObjectId.isValid(id)) {
      try {
        quiz = await collection.findOne({ _id: new ObjectId(id) });
      } catch {}
    }

    if (!quiz) {
      quiz = await collection.findOne({ quiz_id: id });
    }

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const formattedQuiz = {
      _id: quiz._id.toString(),
      quiz_id: quiz.quiz_id || '',
      title: quiz.title || quiz.quiz_name || quiz.name || 'Untitled Quiz',
      category: quiz.category || 'General',
      timer: quiz.timer || 15,
      negative_marking: quiz.negative_marking || 0,
      type: quiz.type || 'free',
      creator_id: quiz.creator_id || '',
      creator_name: quiz.creator_name || '',
      created_at: quiz.created_at || '',
      timestamp: quiz.timestamp || '',
      questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
      questions: Array.isArray(quiz.questions)
        ? quiz.questions.map((q: any, index: number) => ({
            _id: q._id?.toString() || `q-${index}`,
            question: q.question || q.text || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: typeof q.answer === 'number' ? q.answer : (typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.correct_answer === 'number' ? q.correct_answer : 0)),
            category: q.category || '',
            quiz_name: q.quiz_name || '',
            quiz_id: q.quiz_id || '',
            creator_id: q.creator_id || '',
            creator: q.creator || '',
            timer: q.timer || 15,
            timestamp: q.timestamp || '',
          }))
        : [],
    };

    res.setHeader('Cache-Control', 'no-cache');
    return res.status(200).json(formattedQuiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return res.status(500).json({
      error: 'Failed to fetch quiz',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
