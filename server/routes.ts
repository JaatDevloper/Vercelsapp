import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { MongoClient, ObjectId } from "mongodb";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

let mongoClient: MongoClient | null = null;
let isConnecting = false;
let connectionRetryCount = 0;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

// In-memory OTP storage (email -> { otp, expiresAt })
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASSWORD || "",
  },
});

async function getMongoClient(): Promise<MongoClient> {
  if (mongoClient) {
    try {
      // Verify connection is still alive
      await mongoClient.db().admin().ping();
      return mongoClient;
    } catch (error) {
      console.log("MongoDB connection lost, reconnecting...");
      mongoClient = null;
    }
  }

  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise((resolve) => setTimeout(resolve, 200)); // Shorter wait for Vercel
    return getMongoClient();
  }

  isConnecting = true;

  const uri = process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!uri) {
    isConnecting = false;
    throw new Error("MONGODB_URL environment variable is not set");
  }

  try {
    mongoClient = new MongoClient(uri, {
      connectTimeoutMS: 10000, // Increased for stability
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Increased for concurrent requests
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    });
    
    await mongoClient.connect();
    console.log("Connected to MongoDB successfully");
    isConnecting = false;
    return mongoClient;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    isConnecting = false;
    throw error;
  }
}

// Helper to safely format quiz data
function formatQuiz(quiz: any) {
  return {
    _id: quiz._id?.toString() || "",
    quiz_id: quiz.quiz_id || quiz._id?.toString() || "",
    title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
    category: quiz.category || "General",
    managedCategory: quiz.managedCategory || null,
    timer: quiz.timer || 15,
    negative_marking: quiz.negative_marking || 0,
    type: quiz.type || "free",
    creator_id: quiz.creator_id || "",
    creator_name: quiz.creator_name || quiz.creator || "Unknown",
    created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
    timestamp: quiz.timestamp || quiz.created_at || new Date().toISOString(),
    questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    isDeleted: quiz.isDeleted || false,
    questions: Array.isArray(quiz.questions)
      ? quiz.questions.map((q: any, index: number) => ({
          _id: q._id?.toString() || `q-${index}`,
          question: q.question || q.text || "",
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: typeof q.answer === "number" ? q.answer : (typeof q.correctAnswer === "number" ? q.correctAnswer : (typeof q.correct_answer === "number" ? q.correct_answer : 0)),
          category: q.category || quiz.category || "",
          quiz_name: q.quiz_name || quiz.title || "",
          quiz_id: q.quiz_id || quiz.quiz_id || quiz._id?.toString() || "",
          creator_id: q.creator_id || quiz.creator_id || "",
          creator: q.creator || quiz.creator_name || "",
          timer: q.timer || quiz.timer || 15,
          timestamp: q.timestamp || quiz.timestamp || "",
        }))
      : [],
  };
}

// Helper to format quiz for list view (without questions for performance)
function formatQuizForList(quiz: any) {
  return {
    _id: quiz._id?.toString() || "",
    quiz_id: quiz.quiz_id || quiz._id?.toString() || "",
    title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
    category: quiz.category || "General",
    managedCategory: quiz.managedCategory || null,
    timer: quiz.timer || 15,
    negative_marking: quiz.negative_marking || 0,
    type: quiz.type || "free",
    creator_id: quiz.creator_id || "",
    creator_name: quiz.creator_name || quiz.creator || "Unknown",
    created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
    timestamp: quiz.timestamp || quiz.created_at || new Date().toISOString(),
    questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
    isDeleted: quiz.isDeleted || false,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all quizzes from 'quizzes' collection (NO CATEGORY FILTERING)
  app.get("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("quizzes");

      // Build aggregation pipeline - fetch all quizzes without category checks
      const pipeline: any[] = [];
      
      const matchStage: any = {
        $and: [
          { isDeleted: { $ne: true } }  // Exclude deleted quizzes
        ]
      };
      
      pipeline.push({ $match: matchStage });
      
      // Sort and project
      pipeline.push({ $sort: { created_at: -1, timestamp: -1 } });
      pipeline.push({
        $project: {
          _id: 1,
          quiz_id: 1,
          title: 1,
          quiz_name: 1,
          name: 1,
          category: 1,
          managedCategory: 1,
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
      });

      // Use aggregation to get questionCount without loading all questions
      const quizzes = await collection.aggregate(pipeline).toArray();

      // Format quiz data for response
      const formattedQuizzes = quizzes.map((quiz: any) => ({
        _id: quiz._id?.toString() || "",
        quiz_id: quiz.quiz_id || quiz._id?.toString() || "",
        title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
        category: quiz.category || "General",
        managedCategory: quiz.managedCategory || null,
        timer: quiz.timer || 15,
        negative_marking: quiz.negative_marking || 0,
        type: quiz.type || "free",
        creator_id: quiz.creator_id || "",
        creator_name: quiz.creator_name || quiz.creator || "Unknown",
        created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
        timestamp: quiz.timestamp || quiz.created_at || new Date().toISOString(),
        questionCount: quiz.questionCount || 0,
        isDeleted: quiz.isDeleted || false,
      }));

      // Set cache headers for better performance
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(formattedQuizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      
      // Return empty array instead of error for better UX
      if (error instanceof Error && error.message.includes("MONGODB_URI")) {
        return res.status(503).json({
          error: "Database not configured",
          message: "Please configure MongoDB connection",
          quizzes: [],
        });
      }
      
      res.status(500).json({
        error: "Failed to fetch quizzes",
        message: error instanceof Error ? error.message : "Unknown error",
        quizzes: [],
      });
    }
  });

  // Get single quiz by ID
  app.get("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: "Quiz ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("quizzes");

      let quiz = null;

      // Try finding by string _id first (custom format like "0zamBb_1747544159")
      quiz = await collection.findOne({ _id: id as any });

      // Try ObjectId if string didn't work
      if (!quiz && ObjectId.isValid(id)) {
        try {
          quiz = await collection.findOne({ _id: new ObjectId(id) });
        } catch (e) {
          // Ignore ObjectId conversion errors
        }
      }

      // Try by quiz_id field
      if (!quiz) {
        quiz = await collection.findOne({ quiz_id: id });
      }

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const formattedQuiz = formatQuiz(quiz);

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(formattedQuiz);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      res.status(500).json({
        error: "Failed to fetch quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ BROADCAST API ENDPOINTS ============

  // Post a broadcast message
  app.post("/api/admin/broadcast", async (req: Request, res: Response) => {
    try {
      const { message, title, type } = req.body;

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ error: "Message is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("broadcasts");

      const broadcastData = {
        title: title || "System Broadcast",
        message: message.trim(),
        type: type || "info",
        createdAt: new Date().toISOString(),
      };

      await collection.insertOne(broadcastData);

      res.status(201).json({ message: "Broadcast sent successfully" });
    } catch (error) {
      console.error("Error sending broadcast:", error);
      res.status(500).json({
        error: "Failed to send broadcast",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get notifications for user
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("broadcasts");

      const notifications = await collection.find()
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray();

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({
        error: "Failed to fetch notifications",
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      const mongoStatus = mongoClient ? "connected" : "disconnected";
      let dbStatus = "unknown";
      
      if (mongoClient) {
        try {
          await mongoClient.db().admin().ping();
          dbStatus = "healthy";
        } catch {
          dbStatus = "unhealthy";
        }
      }

      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        mongodb: {
          status: mongoStatus,
          health: dbStatus,
        },
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Debug endpoint for database inspection
  app.get("/api/debug/db", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collections = await db.listCollections().toArray();

      const collectionInfo = [];
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        const sample = count > 0 ? await db.collection(col.name).findOne() : null;
        collectionInfo.push({
          name: col.name,
          count,
          sampleFields: sample ? Object.keys(sample) : [],
        });
      }

      res.json({
        database: "quizbot",
        collections: collectionInfo,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ OTP EMAIL VERIFICATION ENDPOINTS ============

  // Request OTP
  app.post("/api/otp/request", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email is required" });
      }

      const normalizedEmail = email.toLowerCase();
      const otp = Math.random().toString().slice(2, 8);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

      otpStore.set(normalizedEmail, { otp, expiresAt });

      // Send OTP via email
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Your TestOne OTP Verification Code",
          html: `
            <h2>Email Verification</h2>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 10 minutes.</p>
            <p>Do not share this code with anyone.</p>
          `,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Store OTP anyway for testing
      }

      res.json({ message: "OTP sent to your email" });
    } catch (error) {
      console.error("Error requesting OTP:", error);
      res.status(500).json({
        error: "Failed to send OTP",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Verify OTP
  app.post("/api/otp/verify", async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      const normalizedEmail = email.toLowerCase();
      const storedOTP = otpStore.get(normalizedEmail);

      if (!storedOTP) {
        return res.status(400).json({ error: "OTP not found. Please request a new one." });
      }

      if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(normalizedEmail);
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }

      if (storedOTP.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
      }

      // Clear OTP after successful verification
      otpStore.delete(normalizedEmail);

      res.json({ message: "OTP verified successfully" });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({
        error: "Failed to verify OTP",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Reset Password with OTP
  app.post("/api/profile/reset-password", async (req: Request, res: Response) => {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "Email, OTP, and new password are required" });
      }

      const normalizedEmail = email.toLowerCase();
      const storedOTP = otpStore.get(normalizedEmail);

      if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expiresAt) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const result = await collection.updateOne(
        { email: normalizedEmail },
        { $set: { passwordHash: hashedPassword, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Profile not found with this email" });
      }

      otpStore.delete(normalizedEmail);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  // Change Password (Authenticated)
  app.post("/api/profile/change-password", async (req: Request, res: Response) => {
    try {
      const { deviceId, oldPassword, newPassword } = req.body;

      if (!deviceId || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "Device ID, old password, and new password are required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      const profile = await collection.findOne({ deviceId });
      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      const isPasswordValid = await bcrypt.compare(oldPassword, profile.passwordHash);
      if (!isPasswordValid) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await collection.updateOne(
        { deviceId },
        { $set: { passwordHash: hashedPassword, updatedAt: new Date().toISOString() } }
      );

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // ============ BATCHES API ENDPOINTS ============
  app.post("/api/batches/purchase", async (req: Request, res: Response) => {
    try {
      const { deviceId, batchId } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");
      
      await db.collection("appprofile").updateOne(
        { deviceId },
        { $addToSet: { unlockedBatches: batchId } }
      );
      
      res.json({ message: "Batch purchased successfully" });
    } catch (error) {
      res.status(500).json({ error: "Purchase failed" });
    }
  });

  app.post("/api/admin/batches", async (req: Request, res: Response) => {
    try {
      const { title, description, thumbnail, topics, price } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("batches");
      
      const batchData = {
        title,
        description,
        thumbnail,
        topics,
        price: price || 0,
        createdAt: new Date().toISOString(),
      };
      
      const result = await collection.insertOne(batchData);
      res.status(201).json({ _id: result.insertedId, ...batchData });
    } catch (error) {
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.get("/api/batches", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const batches = await db.collection("batches").find().sort({ createdAt: -1 }).toArray();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.put("/api/admin/batches/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { title, description, thumbnail, topics, price } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("batches");
      
      const result = await collection.updateOne(
        { _id: ObjectId.isValid(id) ? new ObjectId(id) : id as any },
        { $set: { title, description, thumbnail, topics, price: price || 0, updatedAt: new Date().toISOString() } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "Batch not found" });
      }
      
      res.json({ message: "Batch updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update batch" });
    }
  });

  app.delete("/api/admin/batches/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("batches");
      
      const result = await collection.deleteOne({ 
        _id: ObjectId.isValid(id) ? new ObjectId(id) : id as any 
      });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Batch not found" });
      }
      
      res.json({ message: "Batch deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  // ============ PROFILE API ENDPOINTS ============

  // Get profile by device ID or login with name/email
  app.get("/api/profile", async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string;
      const loginName = req.query.name as string;
      const loginEmail = req.query.email as string;
      const loginPassword = req.query.password as string;
      const newDeviceId = req.query.newDeviceId as string;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      // Handle login with email/password
      if (loginEmail || loginPassword) {
        if (!loginEmail) {
          return res.status(400).json({ error: "Email is required for login" });
        }

        if (!loginPassword) {
          return res.status(400).json({ error: "Password is required for login" });
        }

        const query: any = {
          email: loginEmail.trim().toLowerCase(),
        };

        // If name is provided, include it in the query
        if (loginName) {
          query.name = { $regex: new RegExp(`^${loginName.trim()}$`, "i") };
        }

        const profile = await collection.findOne(query);

        if (!profile) {
          return res.status(404).json({ error: "Invalid email or password. Please check your details and try again." });
        }

        // Verify password
        const isPasswordValid = profile.passwordHash ? await bcrypt.compare(loginPassword, profile.passwordHash) : false;
        
        if (!isPasswordValid) {
          return res.status(404).json({ error: "Invalid email or password. Please check your details and try again." });
        }

        // Migrate quiz history when logging in from a new device
        if (newDeviceId && newDeviceId !== profile.deviceId) {
          const oldDeviceId = profile.deviceId;
          
          // Update profile with new deviceId
          await collection.updateOne(
            { _id: profile._id },
            { $set: { deviceId: newDeviceId, updatedAt: new Date().toISOString() } }
          );
          
          // Migrate quiz history from old deviceId to new deviceId
          const historyCollection = db.collection("apphistory");
          await historyCollection.updateMany(
            { deviceId: oldDeviceId },
            { $set: { deviceId: newDeviceId } }
          );
          
          profile.deviceId = newDeviceId;
        }

        res.set("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.json({
          _id: profile._id?.toString() || "",
          deviceId: profile.deviceId,
          name: profile.name || "",
          email: profile.email || "",
          avatarUrl: profile.avatarUrl || "",
          selectedBadgeId: profile.selectedBadgeId || "",
          selectedFrameId: profile.selectedFrameId || "",
          isPremium: profile.isPremium === true,
          income: profile.income || 0,
          expense: profile.expense || 0,
          currency: profile.currency || "$",
          createdAt: profile.createdAt || new Date().toISOString(),
          updatedAt: profile.updatedAt || new Date().toISOString(),
        });
      }

      // Normal fetch by deviceId
      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const profile = await collection.findOne({ deviceId });

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        _id: profile._id?.toString() || "",
        deviceId: profile.deviceId,
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        selectedBadgeId: profile.selectedBadgeId || "",
        selectedFrameId: profile.selectedFrameId || "",
        isPremium: profile.isPremium === true,
        income: profile.income || 0,
        expense: profile.expense || 0,
        currency: profile.currency || "$",
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: profile.updatedAt || new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        error: "Failed to fetch profile",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Create or update profile
  app.post("/api/profile", async (req: Request, res: Response) => {
    try {
      const { deviceId, name, email, password, avatarUrl, income, expense, currency } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Name is required" });
      }

      if (!email || email.trim().length === 0) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!password || password.length < 8) {
        return res.status(400).json({ error: "Password is required and must be at least 8 characters" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      // Create unique index on deviceId if it doesn't exist
      await collection.createIndex({ deviceId: 1 }, { unique: true });

      const now = new Date().toISOString();
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      const profileData = {
        deviceId,
        name: name.trim(),
        email: email?.trim().toLowerCase() || "",
        passwordHash: hashedPassword,
        avatarUrl: avatarUrl || "",
        income: typeof income === "number" ? income : 0,
        expense: typeof expense === "number" ? expense : 0,
        currency: currency || "$",
        updatedAt: now,
      };

      // Upsert: create if not exists, update if exists
      const result = await collection.findOneAndUpdate(
        { deviceId },
        { 
          $set: profileData,
          $setOnInsert: { createdAt: now }
        },
        { 
          upsert: true, 
          returnDocument: "after" 
        }
      );

      // Handle MongoDB driver result - could be document directly or { value: document }
      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;
      
      if (!profile) {
        return res.status(500).json({ error: "Failed to create profile" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json({
        _id: profile?._id?.toString() || "",
        deviceId: profile?.deviceId,
        name: profile?.name || "",
        email: profile?.email || "",
        avatarUrl: profile?.avatarUrl || "",
        selectedBadgeId: profile?.selectedBadgeId || "",
        selectedFrameId: profile?.selectedFrameId || "",
        isPremium: profile?.isPremium === true,
        income: profile?.income || 0,
        expense: profile?.expense || 0,
        currency: profile?.currency || "$",
        createdAt: profile?.createdAt || now,
        updatedAt: profile?.updatedAt || now,
      });
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      res.status(500).json({
        error: "Failed to save profile",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update profile photo
  app.put("/api/profile/photo", async (req: Request, res: Response) => {
    try {
      const { deviceId, avatarUrl } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      if (!avatarUrl) {
        return res.status(400).json({ error: "Avatar URL/data is required" });
      }

      // Check if base64 image is too large (limit to ~500KB encoded)
      if (avatarUrl.length > 700000) {
        return res.status(400).json({ error: "Image is too large. Please choose a smaller image." });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const profileCollection = db.collection("appprofile");
      const historyCollection = db.collection("apphistory");

      const now = new Date().toISOString();

      // Update profile with new avatar
      const result = await profileCollection.findOneAndUpdate(
        { deviceId },
        { $set: { avatarUrl, updatedAt: now } },
        { returnDocument: "after" }
      );

      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Also update avatarUrl in history records for this user
      await historyCollection.updateMany(
        { deviceId },
        { $set: { userAvatarUrl: avatarUrl } }
      );

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        _id: profile._id?.toString() || "",
        deviceId: profile.deviceId,
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        selectedBadgeId: profile.selectedBadgeId || "",
        selectedFrameId: profile.selectedFrameId || "",
        income: profile.income || 0,
        expense: profile.expense || 0,
        currency: profile.currency || "$",
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      });
    } catch (error) {
      console.error("Error updating profile photo:", error);
      res.status(500).json({
        error: "Failed to update profile photo",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update profile badge
  app.put("/api/profile/badge", async (req: Request, res: Response) => {
    try {
      const { deviceId, badgeId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      const now = new Date().toISOString();

      const result = await collection.findOneAndUpdate(
        { deviceId },
        { $set: { selectedBadgeId: badgeId, updatedAt: now } },
        { returnDocument: "after" }
      );

      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        _id: profile._id?.toString() || "",
        deviceId: profile.deviceId,
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        selectedBadgeId: profile.selectedBadgeId || "",
        selectedFrameId: profile.selectedFrameId || "",
        income: profile.income || 0,
        expense: profile.expense || 0,
        currency: profile.currency || "$",
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      });
    } catch (error) {
      console.error("Error updating profile badge:", error);
      res.status(500).json({
        error: "Failed to update profile badge",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update profile frame
  app.put("/api/profile/frame", async (req: Request, res: Response) => {
    try {
      const { deviceId, frameId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("appprofile");

      const now = new Date().toISOString();

      const result = await collection.findOneAndUpdate(
        { deviceId },
        { $set: { selectedFrameId: frameId, updatedAt: now } },
        { returnDocument: "after" }
      );

      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;

      if (!profile) {
        return res.status(404).json({ error: "Profile not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        _id: profile._id?.toString() || "",
        deviceId: profile.deviceId,
        name: profile.name || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        selectedBadgeId: profile.selectedBadgeId || "",
        selectedFrameId: profile.selectedFrameId || "",
        income: profile.income || 0,
        expense: profile.expense || 0,
        currency: profile.currency || "$",
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      });
    } catch (error) {
      console.error("Error updating profile frame:", error);
      res.status(500).json({
        error: "Failed to update profile frame",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Logout endpoint - clear session but keep profile for re-login
  app.post("/api/profile/logout", async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      // Just return success - profile stays in database for re-login
      // This is a client-side session clear, not a database delete
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Error during logout:", error);
      res.status(500).json({
        error: "Failed to logout",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ QUIZ HISTORY API ENDPOINTS ============

  // Get quiz history by device ID (also matches by userName/userEmail for logged-in users)
  app.get("/api/history", async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string;
      
      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("apphistory");
      const profileCollection = db.collection("appprofile");

      // Look up user's profile to get their name and email
      const profile = await profileCollection.findOne({ deviceId });

      // Build query to find history by deviceId OR by userName/userEmail
      let query: any = { deviceId };
      
      if (profile && (profile.name || profile.email)) {
        query = {
          $or: [
            { deviceId },
            ...(profile.name && profile.email ? [{ 
              userName: { $regex: new RegExp(`^${profile.name}$`, "i") },
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

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(history.map(item => ({
        id: item._id?.toString() || item.id || "",
        deviceId: item.deviceId,
        quizId: item.quizId || "",
        quizTitle: item.quizTitle || "",
        score: item.score || 0,
        totalQuestions: item.totalQuestions || 0,
        correctAnswers: item.correctAnswers || 0,
        completedAt: item.completedAt || new Date().toISOString(),
      })));
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      res.status(500).json({
        error: "Failed to fetch quiz history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Add quiz history item
  app.post("/api/history", async (req: Request, res: Response) => {
    try {
      const { deviceId, quizId, quizTitle, score, totalQuestions, correctAnswers, completedAt } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      if (!quizId || !quizTitle) {
        return res.status(400).json({ error: "Quiz ID and title are required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const historyCollection = db.collection("apphistory");
      const profileCollection = db.collection("appprofile");

      // Create index on deviceId for efficient queries
      historyCollection.createIndex({ deviceId: 1 }).catch(e => console.warn("Index creation failed:", e));
      // Create compound index for sorting
      historyCollection.createIndex({ deviceId: 1, completedAt: -1 }).catch(e => console.warn("Index creation failed:", e));

      // Look up the user's profile to get reliable name and email
      const profile = await profileCollection.findOne({ deviceId });
      
      // ONLY save history if the user has a profile (is logged in)
      if (!profile) {
        return res.status(200).json({ 
          message: "History not saved for non-logged in user",
          skipped: true 
        });
      }
      
      // Use profile data if available
      const userName = profile.name || "";
      const userEmail = profile.email || "";
      const profileId = profile._id?.toString() || "";

      const historyItem = {
        deviceId,
        quizId,
        quizTitle,
        score: typeof score === "number" ? score : 0,
        totalQuestions: typeof totalQuestions === "number" ? totalQuestions : 0,
        correctAnswers: typeof correctAnswers === "number" ? correctAnswers : 0,
        completedAt: completedAt || new Date().toISOString(),
        userName,
        userEmail,
        profileId,
      };

      const result = await historyCollection.insertOne(historyItem);

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json({
        id: result.insertedId.toString(),
        ...historyItem,
      });
    } catch (error) {
      console.error("Error adding history item:", error);
      res.status(500).json({
        error: "Failed to save quiz history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ ADMIN API ENDPOINTS ============

  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      console.log("ADMIN API: Fetching users from MongoDB...");
      const client = await getMongoClient();
      const db = client.db("quizbot");
      
      const profiles = await db.collection("appprofile").find({}).toArray();
      const allHistory = await db.collection("apphistory").find({}).toArray();
      
      console.log(`ADMIN API: Found ${profiles.length} profiles and ${allHistory.length} history records`);

      const usersWithStats = profiles.map(profile => {
        const userHistory = allHistory.filter(h => 
          (profile.deviceId && h.deviceId === profile.deviceId) || 
          (profile.email && h.userEmail && h.userEmail.toLowerCase() === profile.email.toLowerCase())
        );

        return {
          id: profile._id?.toString() || profile.deviceId || Math.random().toString(36).substring(2, 11),
          username: profile.name || profile.userName || profile.username || "Unknown User",
          email: profile.email || profile.userEmail || "",
          avatarUrl: profile.avatarUrl || "",
          role: profile.role || "user",
          createdAt: profile.createdAt || new Date().toISOString(),
          quizCount: [...new Set(userHistory.map(h => h.quizId))].length,
          attempts: userHistory.length,
          history: userHistory.map(h => ({
            quizTitle: h.quizTitle,
            score: h.score,
            completedAt: h.completedAt,
            correctAnswers: h.correctAnswers,
            totalQuestions: h.totalQuestions
          }))
        };
      });

      console.log(`ADMIN API: Returning ${usersWithStats.length} users`);
      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(usersWithStats);
    } catch (error) {
      console.error("ADMIN API: Error fetching admin users:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get dashboard statistics
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      
      const [usersCount, quizzesCount, roomsCount, activeRoomsCount, history] = await Promise.all([
        db.collection("appprofile").countDocuments(),
        db.collection("quizzes").countDocuments(),
        db.collection("rooms").countDocuments(),
        db.collection("rooms").countDocuments({ status: "active" }),
        db.collection("apphistory").find().toArray()
      ]);

      const avgScore = history.length > 0 
        ? Math.round(history.reduce((acc, h) => acc + (h.score || 0), 0) / history.length) 
        : 0;

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        totalUsers: usersCount,
        totalQuizzes: quizzesCount,
        totalRooms: roomsCount,
        activeRooms: activeRoomsCount,
        avgScore,
        totalAttempts: history.length
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get leaderboard - aggregates quiz history with profile data using $lookup
  app.get("/api/leaderboard", async (req: Request, res: Response) => {
    try {
      const timeFilter = req.query.filter as string || "allTime";
      
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const historyCollection = db.collection("apphistory");

      let dateFilter = {};
      const now = new Date();
      
      if (timeFilter === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = { completedAt: { $gte: startOfDay.toISOString() } };
      } else if (timeFilter === "month") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = { completedAt: { $gte: startOfMonth.toISOString() } };
      }

      // Build indices for better performance
      // Only try to create index if it's the first time or we're sure it's needed
      // Note: In serverless environments like Vercel, frequent index creation can be slow
      // Ideally these should be created once via a migration script or DB console
      if (!mongoClient || !isConnecting) {
        try {
          historyCollection.createIndex({ completedAt: -1 }).catch(e => console.warn("Index creation failed:", e));
          historyCollection.createIndex({ deviceId: 1 }).catch(e => console.warn("Index creation failed:", e));
        } catch (e) {
          console.warn("Index creation attempt failed", e);
        }
      }

      // Use a lean projection immediately to reduce the data set
      const leaderboardData = await historyCollection.aggregate([
        { $match: dateFilter },
        { $project: { deviceId: 1, score: 1, correctAnswers: 1, userName: 1, userEmail: 1, userAvatarUrl: 1 } },
        {
          $group: {
            _id: "$deviceId",
            totalPoints: { $sum: "$score" },
            totalQuizzes: { $sum: 1 },
            totalCorrect: { $sum: "$correctAnswers" },
            userName: { $first: "$userName" },
            userEmail: { $first: "$userEmail" },
            userAvatarUrl: { $first: "$userAvatarUrl" },
          },
        },
        { $sort: { totalPoints: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "appprofile",
            localField: "_id",
            foreignField: "deviceId",
            as: "profileData"
          }
        },
        { $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            deviceId: "$_id",
            totalPoints: 1,
            totalQuizzes: 1,
            totalCorrect: 1,
            userName: 1,
            userEmail: 1,
            userAvatarUrl: 1,
            profileName: "$profileData.name",
            profileEmail: "$profileData.email",
            profileAvatarUrl: "$profileData.avatarUrl"
          }
        }
      ], {
        allowDiskUse: true,
        maxTimeMS: 15000 // Restore reasonable timeout
      }).toArray();

      const leaderboard = leaderboardData.map((entry: any, index: number) => {
        const name = entry.profileName || entry.userName || "Anonymous";
        const email = entry.profileEmail || entry.userEmail || "";
        
        return {
          id: entry.deviceId || `user-${index}`,
          name,
          username: email ? email.split("@")[0] : "player",
          email,
          avatarUrl: entry.userAvatarUrl || entry.profileAvatarUrl || "",
          points: entry.totalPoints || 0,
          quizzesTaken: entry.totalQuizzes || 0,
          correctAnswers: entry.totalCorrect || 0,
          rank: index + 1,
        };
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({
        error: "Failed to fetch leaderboard",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Backfill existing history records with profile data
  app.post("/api/history/backfill", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const historyCollection = db.collection("apphistory");
      const profileCollection = db.collection("appprofile");

      // Get all unique deviceIds from history that have empty userName
      const historyItems = await historyCollection.find({
        $or: [
          { userName: { $exists: false } },
          { userName: "" },
          { userName: null }
        ]
      }).toArray();

      let updatedCount = 0;
      
      for (const item of historyItems) {
        if (item.deviceId) {
          const profile = await profileCollection.findOne({ deviceId: item.deviceId });
          
          if (profile && (profile.name || profile.email)) {
            await historyCollection.updateOne(
              { _id: item._id },
              {
                $set: {
                  userName: profile.name || "",
                  userEmail: profile.email || "",
                  profileId: profile._id?.toString() || ""
                }
              }
            );
            updatedCount++;
          }
        }
      }

      res.json({
        success: true,
        message: `Backfilled ${updatedCount} history records with profile data`,
        totalProcessed: historyItems.length,
        updated: updatedCount
      });
    } catch (error) {
      console.error("Error backfilling history:", error);
      res.status(500).json({
        error: "Failed to backfill history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Clear quiz history by device ID
  app.delete("/api/history", async (req: Request, res: Response) => {
    try {
      const deviceId = req.query.deviceId as string;
      
      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("apphistory");

      const result = await collection.deleteMany({ deviceId });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        success: true,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error clearing quiz history:", error);
      res.status(500).json({
        error: "Failed to clear quiz history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ MULTIPLAYER ROOM API ENDPOINTS ============

  // Map of room codes to connected WebSocket clients
  const roomClients = new Map<string, Set<any>>();

  function broadcastToRoom(roomCode: string, message: object) {
    const clients = roomClients.get(roomCode);
    if (clients) {
      const data = JSON.stringify(message);
      clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
          client.send(data);
        }
      });
    }
  }

  // Generate unique 6-character room code
  function generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Create a new multiplayer room
  app.post("/api/rooms", async (req: Request, res: Response) => {
    try {
      const { quizId, hostName } = req.body;

      if (!quizId) {
        return res.status(400).json({ error: "Quiz ID is required" });
      }

      if (!hostName || hostName.trim().length === 0) {
        return res.status(400).json({ error: "Your name is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      // Generate unique room code
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
        status: "waiting", // waiting, active, completed
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

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json({
        roomCode,
        odId: hostId,
        quizId,
        status: "waiting",
        participants: room.participants,
      });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({
        error: "Failed to create room",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Join an existing room
  app.post("/api/rooms/:roomCode/join", async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;
      const { playerName } = req.body;

      if (!playerName || playerName.trim().length === 0) {
        return res.status(400).json({ error: "Your name is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      const room = await roomsCollection.findOne({ 
        roomCode: roomCode.toUpperCase(), 
        status: "waiting" 
      });

      if (!room) {
        return res.status(404).json({ error: "Room not found or quiz already started" });
      }

      const odId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newParticipant = {
        odId,
        name: playerName.trim(),
        isHost: false,
        score: 0,
        correctAnswers: 0,
        finished: false,
        joinedAt: new Date().toISOString(),
      };

      await roomsCollection.updateOne(
        { roomCode: roomCode.toUpperCase() },
        { $push: { participants: newParticipant } as any }
      );

      const updatedRoom = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      // Broadcast to WebSocket clients
      broadcastToRoom(roomCode.toUpperCase(), {
        type: "player_joined",
        player: newParticipant,
        participants: updatedRoom?.participants || [],
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        roomCode: roomCode.toUpperCase(),
        odId,
        quizId: room.quizId,
        status: room.status,
        participants: updatedRoom?.participants || [],
      });
    } catch (error) {
      console.error("Error joining room:", error);
      res.status(500).json({
        error: "Failed to join room",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get room status
  app.get("/api/rooms/:roomCode", async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      const room = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        roomCode: room.roomCode,
        quizId: room.quizId,
        status: room.status,
        participants: room.participants || [],
        startedAt: room.startedAt,
        completedAt: room.completedAt,
      });
    } catch (error) {
      console.error("Error getting room:", error);
      res.status(500).json({
        error: "Failed to get room",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Start quiz (host only)
  app.post("/api/rooms/:roomCode/start", async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;
      const { odId } = req.body;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      const room = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if requester is host
      const host = room.participants?.find((p: any) => p.isHost && p.odId === odId);
      if (!host) {
        return res.status(403).json({ error: "Only the host can start the quiz" });
      }

      if (room.status !== "waiting") {
        return res.status(400).json({ error: "Quiz has already started" });
      }

      await roomsCollection.updateOne(
        { roomCode: roomCode.toUpperCase() },
        { 
          $set: { 
            status: "active",
            startedAt: new Date().toISOString()
          } 
        }
      );

      // Broadcast quiz start to all participants
      broadcastToRoom(roomCode.toUpperCase(), {
        type: "quiz_started",
        quizId: room.quizId,
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, status: "active" });
    } catch (error) {
      console.error("Error starting quiz:", error);
      res.status(500).json({
        error: "Failed to start quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Submit quiz result
  app.post("/api/rooms/:roomCode/submit", async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;
      const { odId, score, correctAnswers, totalQuestions } = req.body;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      const room = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Update participant's score
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

      // Check if all participants finished
      if (allFinished) {
        await roomsCollection.updateOne(
          { roomCode: roomCode.toUpperCase() },
          { $set: { status: "completed", completedAt: new Date().toISOString() } }
        );
      }

      // Broadcast player finished
      broadcastToRoom(roomCode.toUpperCase(), {
        type: "player_finished",
        odId,
        score,
        correctAnswers,
        allFinished,
        participants: updatedRoom?.participants || [],
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ 
        success: true, 
        allFinished,
        participants: updatedRoom?.participants || [],
      });
    } catch (error) {
      console.error("Error submitting result:", error);
      res.status(500).json({ error: "Failed to submit result" });
    }
  });

  // Create a new quiz (User created)
  app.post("/api/user/create-quiz", async (req: Request, res: Response) => {
    try {
      const { title, description, timer, negativeMarking, questions, category, creator_id, creator_name } = req.body;

      if (!title || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: "Title and questions are required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("quizzes");

      const quizId = Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      
      const newQuiz: any = {
        _id: quizId,
        quiz_id: quizId,
        title: title.trim(),
        description: description?.trim() || "",
        category: category || "General",
        timer: timer || 15,
        negative_marking: negativeMarking || 0,
        type: "user_created",
        creator_id: creator_id || "anonymous",
        creator_name: creator_name || "User",
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        questions: questions.map((q: any, index: number) => ({
          _id: `q-${quizId}-${index}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          timer: timer || 15,
        })),
        isDeleted: false
      };

      await collection.insertOne(newQuiz);

      res.status(201).json({ 
        message: "Quiz created successfully", 
        quiz_id: quizId,
        quiz: formatQuiz(newQuiz)
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({
        error: "Failed to create quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Leave room
  app.post("/api/rooms/:roomCode/leave", async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;
      const { odId } = req.body;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const roomsCollection = db.collection("approom");

      await roomsCollection.updateOne(
        { roomCode: roomCode.toUpperCase() },
        { $pull: { participants: { odId } } as any }
      );

      const updatedRoom = await roomsCollection.findOne({ roomCode: roomCode.toUpperCase() });

      // Broadcast player left
      broadcastToRoom(roomCode.toUpperCase(), {
        type: "player_left",
        odId,
        participants: updatedRoom?.participants || [],
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving room:", error);
      res.status(500).json({
        error: "Failed to leave room",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ OWNER PROFILE API ENDPOINTS ============

  // Get owner profile (app creator information for About section)
  app.get("/api/ownerprofile", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("ownerprofile");

      const ownerProfile = await collection.findOne({});

      if (!ownerProfile) {
        // Return default owner profile if none exists
        return res.json({
          name: "Govind Chowdhury",
          title: "App Developer & Creator",
          imageUrl: "",
          about: "Passionate developer creating amazing quiz experiences",
          skills: ["React Native", "Node.js", "MongoDB", "TypeScript"],
          profession: "Full Stack Developer",
          experience: [
            { title: "App Developer", company: "TestOne", period: "2024 - Present" }
          ],
          socialLinks: {
            behance: "",
            dribbble: "",
            linkedin: "",
            instagram: ""
          },
          achievements: ["Quiz App Creator", "Mobile Developer", "UI/UX Designer"]
        });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        _id: ownerProfile._id?.toString() || "",
        name: ownerProfile.name || "Govind Chowdhury",
        title: ownerProfile.title || "App Developer & Creator",
        imageUrl: ownerProfile.imageUrl || "",
        about: ownerProfile.about || "",
        skills: ownerProfile.skills || [],
        profession: ownerProfile.profession || "",
        experience: ownerProfile.experience || [],
        socialLinks: ownerProfile.socialLinks || {},
        achievements: ownerProfile.achievements || []
      });
    } catch (error) {
      console.error("Error fetching owner profile:", error);
      res.status(500).json({
        error: "Failed to fetch owner profile",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Create or update owner profile
  app.post("/api/ownerprofile", async (req: Request, res: Response) => {
    try {
      const { name, title, imageUrl, about, skills, profession, experience, socialLinks, achievements } = req.body;

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const collection = db.collection("ownerprofile");

      const now = new Date().toISOString();
      const profileData = {
        name: name || "Govind Chowdhury",
        title: title || "App Developer & Creator",
        imageUrl: imageUrl || "",
        about: about || "",
        skills: skills || [],
        profession: profession || "",
        experience: experience || [],
        socialLinks: socialLinks || {},
        achievements: achievements || [],
        updatedAt: now,
      };

      // Upsert: create if not exists, update if exists (only one owner profile)
      const result = await collection.findOneAndUpdate(
        {},
        { 
          $set: profileData,
          $setOnInsert: { createdAt: now }
        },
        { 
          upsert: true, 
          returnDocument: "after" 
        }
      );

      const profile = result && typeof result === 'object' && 'value' in result ? result.value : result;

      if (!profile) {
        return res.status(500).json({ error: "Failed to save owner profile" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(201).json({
        _id: profile._id?.toString() || "",
        name: profile.name,
        title: profile.title,
        imageUrl: profile.imageUrl,
        about: profile.about,
        skills: profile.skills,
        profession: profile.profession,
        experience: profile.experience,
        socialLinks: profile.socialLinks,
        achievements: profile.achievements,
        createdAt: profile.createdAt || now,
        updatedAt: profile.updatedAt || now,
      });
    } catch (error) {
      console.error("Error saving owner profile:", error);
      res.status(500).json({
        error: "Failed to save owner profile",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ WEBSOCKET SETUP ============

  const httpServer = createServer(app);

  // WebSocket server for real-time room updates
  const { WebSocketServer } = await import("ws");
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: any) => {
    let currentRoomCode: string | null = null;

    ws.on("message", (data: any) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join_room") {
          const roomCode = message.roomCode?.toUpperCase();
          if (roomCode) {
            // Leave previous room if any
            if (currentRoomCode && roomClients.has(currentRoomCode)) {
              roomClients.get(currentRoomCode)?.delete(ws);
            }

            // Join new room
            currentRoomCode = roomCode;
            if (!roomClients.has(roomCode)) {
              roomClients.set(roomCode, new Set());
            }
            roomClients.get(roomCode)?.add(ws);

            ws.send(JSON.stringify({ type: "joined_room", roomCode }));
          }
        }

        if (message.type === "leave_room" && currentRoomCode) {
          if (roomClients.has(currentRoomCode)) {
            roomClients.get(currentRoomCode)?.delete(ws);
          }
          currentRoomCode = null;
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      if (currentRoomCode && roomClients.has(currentRoomCode)) {
        roomClients.get(currentRoomCode)?.delete(ws);
      }
    });
  });

  console.log("WebSocket server initialized on /ws");

  // ============ ADMIN STATS ENDPOINT ============
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");

      // Fetch all required stats in parallel
      const [totalUsers, totalQuizzes, totalRooms, historyDocs] = await Promise.all([
        db.collection("appprofile").countDocuments(),
        db.collection("quizzes").countDocuments(),
        db.collection("approom").countDocuments(),
        db.collection("apphistory").find({}).toArray(),
      ]);

      // Calculate active rooms (rooms with recent activity in last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeRoomsCount = await db.collection("approom").countDocuments({
        lastActivityAt: { $gte: oneDayAgo }
      });

      // Calculate average score from history
      let avgScore = 0;
      if (historyDocs.length > 0) {
        const totalScore = historyDocs.reduce((sum: number, doc: any) => {
          return sum + (parseFloat(doc.score) || 0);
        }, 0);
        avgScore = Math.round((totalScore / historyDocs.length) * 10) / 10;
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        totalUsers,
        totalQuizzes,
        totalRooms,
        activeRooms: activeRoomsCount,
        avgScore: isNaN(avgScore) ? 0 : avgScore,
        totalAttempts: historyDocs.length,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        error: "Failed to fetch admin stats",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all users with their stats for admin dashboard
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");

      // Fetch all users from appprofile
      const users = await db.collection("appprofile").find({}).toArray();

      // Fetch all history records to calculate stats
      const historyRecords = await db.collection("apphistory").find({}).toArray();

      // Map users and calculate their stats
      const usersWithStats = users.map((user: any) => {
        // Get all history records for this user
        const userHistory = historyRecords.filter(
          (h: any) => h.deviceId === user.deviceId || 
                      (h.userName === user.name && h.userEmail === user.email)
        );

        // Count unique quizzes taken
        const uniqueQuizzes = new Set(userHistory.map((h: any) => h.quizId)).size;

        return {
          id: user._id?.toString() || user.deviceId,
          username: user.name || "Unknown User",
          email: user.email || "",
          avatarUrl: user.avatarUrl || "",
          role: user.role || "user", // Default role is 'user'
          createdAt: user.createdAt || new Date().toISOString(),
          quizCount: uniqueQuizzes,
          attempts: userHistory.length,
        };
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(usersWithStats);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Unknown error",
        users: [],
      });
    }
  });

  // ============ QUIZ MANAGEMENT API ENDPOINTS ============

  // Get all quizzes with manage data (for admin/owner to manage)
  app.get("/api/manage/quizzes", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const quizzesCollection = db.collection("quizzes");
      const manageCollection = db.collection("manage");

      // Create index for faster lookups
      await manageCollection.createIndex({ quiz_id: 1 });

      // Get all manage data (includes full quiz info with categories)
      const allManageData = await manageCollection.find({}).toArray();
      const manageDataMap = new Map(
        allManageData.map((md: any) => [md.quiz_id, md])
      );

      // Get all quizzes
      const allQuizzes = await quizzesCollection.find({}).toArray();
      
      // Build quiz response, prioritizing manage collection data
      const quizzesWithManageData = allQuizzes.map((quiz: any) => {
        const quizStringId = quiz._id?.toString() || "";
        const quizIdField = quiz.quiz_id || "";
        
        // Try both the string _id and quiz_id field to find manage data
        let manageData = manageDataMap.get(quizStringId);
        if (!manageData) {
          manageData = manageDataMap.get(quizIdField);
        }
        
        // Use manage data if available (it has the admin-managed category), otherwise use quiz data
        const effectiveCategory = manageData?.category || quiz.category || "General";
        
        return {
          _id: quizStringId,
          quiz_id: quizIdField || quizStringId || "",
          title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
          category: effectiveCategory,
          questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
          created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
          creator_name: quiz.creator_name || quiz.creator || "Unknown",
          isDeleted: manageData?.isDeleted || false,
          managedCategory: manageData?.category || null,
          lastUpdated: manageData?.updatedAt || quiz.created_at || new Date().toISOString(),
        };
      });

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(quizzesWithManageData);
    } catch (error) {
      console.error("Error fetching manage quizzes:", error);
      res.status(500).json({
        error: "Failed to fetch quizzes",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get or create quiz categories
  app.get("/api/manage/categories", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const categoriesCollection = db.collection("quiz_categories");
      const manageCollection = db.collection("manage");

      // Create index if it doesn't exist
      await categoriesCollection.createIndex({ name: 1 }, { unique: true });

      // First, try to get categories from quiz_categories collection
      let categories = await categoriesCollection.find({}).toArray();

      // If no categories in quiz_categories, get unique categories from manage collection
      if (categories.length === 0) {
        const uniqueCategories = await manageCollection
          .aggregate([
            { $match: { category: { $exists: true, $ne: null } } },
            { $group: { _id: "$category" } },
            { $sort: { _id: 1 } }
          ])
          .toArray();

        if (uniqueCategories.length > 0) {
          // Create category objects with default colors
          const categoryColors: Record<string, string> = {
            "Science": "#FF6B6B",
            "History": "#4ECDC4",
            "Technology": "#95E1D3",
            "Sports": "#F38181",
            "Entertainment": "#AA96DA",
            "General Knowledge": "#FCBAD3",
            "Art&Culture": "#FFB3BA",
            "Rajasthan History": "#BAE1FF",
          };

          categories = uniqueCategories.map((cat) => ({
            _id: new ObjectId(),
            name: cat._id,
            color: categoryColors[cat._id] || "#95E1D3",
            icon: "tag",
            createdAt: new Date().toISOString(),
          }));

          // Insert them into quiz_categories for future use
          await categoriesCollection.insertMany(categories as any).catch(() => {
            // Ignore duplicate key errors
          });

          return res.set("Cache-Control", "no-cache, no-store, must-revalidate").json(categories);
        }

        // If still no categories, use defaults
        const defaultCategories = [
          { name: "Science", color: "#FF6B6B", icon: "flask" },
          { name: "History", color: "#4ECDC4", icon: "book" },
          { name: "Technology", color: "#95E1D3", icon: "zap" },
          { name: "Sports", color: "#F38181", icon: "activity" },
          { name: "Entertainment", color: "#AA96DA", icon: "film" },
          { name: "General Knowledge", color: "#FCBAD3", icon: "star" },
          { name: "Art&Culture", color: "#FFB3BA", icon: "palette" },
          { name: "Rajasthan History", color: "#BAE1FF", icon: "book" },
        ];

        await categoriesCollection.insertMany(
          defaultCategories.map((cat) => ({
            _id: new ObjectId(),
            ...cat,
            createdAt: new Date().toISOString(),
          })) as any
        ).catch(() => {
          // Ignore duplicate key errors
        });

        return res.json(defaultCategories);
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        error: "Failed to fetch categories",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Create new category
  app.post("/api/manage/categories", async (req: Request, res: Response) => {
    try {
      const { name, color, icon } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const categoriesCollection = db.collection("quiz_categories");

      const category = {
        name: name.trim(),
        color: color || "#95E1D3",
        icon: icon || "tag",
        createdAt: new Date().toISOString(),
      };

      await categoriesCollection.insertOne(category);

      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if ((error as any).code === 11000) {
        return res.status(400).json({ error: "Category already exists" });
      }
      res.status(500).json({
        error: "Failed to create category",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Update quiz (move to category, soft delete, etc.)
  app.put("/api/manage/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { category, isDeleted } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Quiz ID is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const quizzesCollection = db.collection("quizzes");
      const manageCollection = db.collection("manage");

      // Create index on quiz_id
      await manageCollection.createIndex({ quiz_id: 1 });

      // Fetch the full quiz data from quizzes collection
      let fullQuizData: any = null;
      
      // Try finding by string _id first (custom format like "0zamBb_1747544159")
      fullQuizData = await quizzesCollection.findOne({ _id: id as any });
      
      // Try ObjectId if string didn't work
      if (!fullQuizData && ObjectId.isValid(id)) {
        try {
          fullQuizData = await quizzesCollection.findOne({ _id: new ObjectId(id) });
        } catch (e) {
          // Ignore ObjectId conversion errors
        }
      }
      
      // Try quiz_id field if still not found
      if (!fullQuizData) {
        fullQuizData = await quizzesCollection.findOne({ quiz_id: id });
      }

      if (!fullQuizData) {
        return res.status(404).json({ error: "Quiz not found in quizzes collection" });
      }

      // Create update data with FULL quiz information
      const updateData: any = {
        ...fullQuizData, // Copy all fields from the full quiz
        category: category !== undefined ? category : fullQuizData.category || "General",
        managedCategory: category || null, // Store the managed category
        updatedAt: new Date().toISOString(),
      };

      // Ensure quiz_id is set properly
      if (!updateData.quiz_id) {
        updateData.quiz_id = id;
      }

      if (isDeleted !== undefined) {
        updateData.isDeleted = isDeleted;
      }

      // Update the original quiz in quizzes collection with managedCategory
      const quizUpdateData: any = {};
      if (category !== undefined) {
        quizUpdateData.managedCategory = category || null;
      }
      if (isDeleted !== undefined) {
        quizUpdateData.isDeleted = isDeleted;
      }

      // Try updating by string _id first
      let quizUpdateResult = await quizzesCollection.updateOne(
        { _id: id as any },
        { $set: quizUpdateData }
      );

      // Try by ObjectId if not found
      if (quizUpdateResult.matchedCount === 0 && ObjectId.isValid(id)) {
        try {
          quizUpdateResult = await quizzesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: quizUpdateData }
          );
        } catch (e) {
          // Ignore ObjectId conversion errors
        }
      }

      // Try by quiz_id field if still not found
      if (quizUpdateResult.matchedCount === 0) {
        quizUpdateResult = await quizzesCollection.updateOne(
          { quiz_id: id },
          { $set: quizUpdateData }
        );
      }

      // Save the full quiz data to manage collection
      const result = await manageCollection.findOneAndUpdate(
        { quiz_id: id },
        { $set: updateData },
        { upsert: true, returnDocument: "after" }
      );

      const manageData = result && typeof result === 'object' && 'value' in result ? result.value : result;

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(manageData);
    } catch (error) {
      console.error("Error updating quiz manage data:", error);
      res.status(500).json({
        error: "Failed to update quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Edit category
  app.put("/api/manage/categories/:categoryName", async (req: Request, res: Response) => {
    try {
      const { categoryName } = req.params;
      const { name, color, icon } = req.body;

      if (!categoryName) {
        return res.status(400).json({ error: "Category name is required" });
      }

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: "New category name is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const categoriesCollection = db.collection("quiz_categories");

      const updateData: any = {
        name: name.trim(),
      };

      if (color) updateData.color = color;
      if (icon) updateData.icon = icon;

      const result = await categoriesCollection.findOneAndUpdate(
        { name: categoryName },
        { $set: updateData },
        { returnDocument: "after" }
      );

      if (!result || !result.value) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(result.value);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        error: "Failed to update category",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Delete category
  app.delete("/api/manage/categories/:categoryName", async (req: Request, res: Response) => {
    try {
      const { categoryName } = req.params;

      if (!categoryName) {
        return res.status(400).json({ error: "Category name is required" });
      }

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const categoriesCollection = db.collection("quiz_categories");

      const result = await categoriesCollection.deleteOne({ name: categoryName });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        error: "Failed to delete category",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get quizzes by category from "manage" collection (for home screen display)
  app.get("/api/manage/category/:categoryName", async (req: Request, res: Response) => {
    try {
      let { categoryName } = req.params;

      if (!categoryName) {
        return res.status(400).json({ error: "Category name is required" });
      }

      // Decode URL-encoded category names (e.g., "Art%26Culture" -> "Art&Culture")
      categoryName = decodeURIComponent(categoryName);

      const client = await getMongoClient();
      const db = client.db("quizbot");
      const quizzesCollection = db.collection("quizzes");
      const manageCollection = db.collection("manage");

      // 1. Fetch from "manage" collection (admin/system quizzes)
      const manageQuizzes = await manageCollection.find({
        category: categoryName,
        isDeleted: { $ne: true }
      }).toArray();

      // 2. Fetch from "quizzes" collection (user-created quizzes)
      const userQuizzes = await quizzesCollection.find({
        category: categoryName,
        isDeleted: { $ne: true }
      }).toArray();

      // Combine and format
      const allQuizzes = [...manageQuizzes, ...userQuizzes];

      // Format the response
      const formattedQuizzes = allQuizzes.map((quiz: any) => ({
        _id: quiz._id?.toString() || "",
        quiz_id: quiz.quiz_id || quiz._id?.toString() || "",
        title: quiz.title || quiz.quiz_name || quiz.name || "Untitled Quiz",
        category: quiz.category || categoryName,
        timer: quiz.timer || 15,
        negative_marking: quiz.negative_marking || 0,
        type: quiz.type || "free",
        creator_id: quiz.creator_id || "",
        creator_name: quiz.creator_name || quiz.creator || "Unknown",
        created_at: quiz.created_at || quiz.timestamp || new Date().toISOString(),
        timestamp: quiz.timestamp || quiz.created_at || new Date().toISOString(),
        questionCount: Array.isArray(quiz.questions) ? quiz.questions.length : 0,
        updatedAt: quiz.updatedAt || new Date().toISOString(),
        isDeleted: quiz.isDeleted || false,
      }));

      // Sort combined results by time
      formattedQuizzes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(formattedQuizzes);
    } catch (error) {
      console.error("Error fetching quizzes by category:", error);
      res.status(500).json({
        error: "Failed to fetch quizzes",
        message: error instanceof Error ? error.message : "Unknown error",
        quizzes: [],
      });
    }
  });

  // Get analytics data from appprofile and apphistory collections
  app.get("/api/analytics", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      
      const [profiles, history] = await Promise.all([
        db.collection("appprofile").find({}).toArray(),
        db.collection("apphistory").find({}).toArray(),
      ]);

      // Calculate user engagement metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const dailyActiveUsers = profiles.filter(p => {
        const lastActive = p.lastActivityDate || p.created_at;
        return lastActive && new Date(lastActive) > oneDayAgo;
      }).length;

      const weeklyActiveUsers = profiles.filter(p => {
        const lastActive = p.lastActivityDate || p.created_at;
        return lastActive && new Date(lastActive) > sevenDaysAgo;
      }).length;

      // Calculate quiz statistics
      const completedQuizzes = history.filter(h => h.status === "completed" || h.result?.status === "completed");
      const totalAttempts = history.length;
      const completionRate = totalAttempts > 0 ? Math.round((completedQuizzes.length / totalAttempts) * 100) / 100 : 0;

      // Find most popular category
      const categoryCounts: Record<string, number> = {};
      history.forEach(h => {
        const category = h.category || h.quiz_category || "General";
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      const mostPopularCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "General";

      // Performance metrics (mock for now - would need Vercel integration for real data)
      const avgResponseTime = 120; // ms
      const uptime = 99.9; // percentage

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json({
        userEngagement: {
          dailyActiveUsers,
          weeklyActiveUsers,
        },
        quizStatistics: {
          completionRate: Math.round(completionRate * 100 * 10) / 10, // Round to 1 decimal
          mostPopularCategory,
        },
        performance: {
          serverResponseTime: avgResponseTime,
          uptime: uptime,
        },
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({
        error: "Failed to fetch analytics",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get all users from appprofile collection (for premium management)
  app.get("/api/admin/users", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const profiles = await db.collection("appprofile").find({}).toArray();

      const users = profiles.map((profile: any) => ({
        id: profile._id?.toString() || profile.user_id || "",
        username: profile.username || profile.user_name || "Unknown",
        role: profile.role || "user",
        createdAt: profile.created_at || new Date().toISOString(),
        quizCount: profile.quizCount || 0,
        attempts: profile.attempts || 0,
        avatarUrl: profile.profile_picture || profile.avatar_url || "",
      }));

      res.set("Cache-Control", "no-cache, no-store, must-revalidate");
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users", users: [] });
    }
  });

  // Grant premium to user
  app.post("/api/admin/premium/grant", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");

      const premiumCollection = db.collection("Premium");
      const profileCollection = db.collection("appprofile");

      // Insert into Premium collection
      await premiumCollection.updateOne(
        { userId },
        {
          $set: {
            userId,
            grantedAt: new Date(),
            status: "active",
          },
        },
        { upsert: true }
      );

      // Update appprofile to mark as premium
      await profileCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isPremium: true } }
      );

      res.json({ message: "Premium granted successfully" });
    } catch (error) {
      console.error("Error granting premium:", error);
      res.status(500).json({ error: "Failed to grant premium" });
    }
  });

  // Remove premium from user
  app.post("/api/admin/premium/remove", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");

      const premiumCollection = db.collection("Premium");
      const profileCollection = db.collection("appprofile");

      // Delete from Premium collection
      await premiumCollection.deleteOne({ userId });

      // Update appprofile to mark as non-premium
      await profileCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { isPremium: false } }
      );

      res.json({ message: "Premium removed successfully" });
    } catch (error) {
      console.error("Error removing premium:", error);
      res.status(500).json({ error: "Failed to remove premium" });
    }
  });

  // Get premium pricing and events
  app.get("/api/admin/premium/pricing", async (req: Request, res: Response) => {
    try {
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const pricingCollection = db.collection("PremiumPricing");

      const pricing = await pricingCollection.findOne({ _id: "default" });
      if (!pricing) {
        return res.json({
          monthlyPrice: 99,
          yearlyPrice: 699,
          currency: "INR",
          eventName: "",
          eventActive: false,
        });
      }

      res.json(pricing);
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ error: "Failed to fetch pricing" });
    }
  });

  // Update premium pricing and events
  app.post("/api/admin/premium/pricing", async (req: Request, res: Response) => {
    try {
      const { monthlyPrice, yearlyPrice, eventName } = req.body;
      const client = await getMongoClient();
      const db = client.db("quizbot");
      const pricingCollection = db.collection("PremiumPricing");

      if (!monthlyPrice || !yearlyPrice) {
        return res.status(400).json({ error: "Missing pricing data" });
      }

      await pricingCollection.updateOne(
        { _id: "default" },
        {
          $set: {
            monthlyPrice: parseInt(monthlyPrice),
            yearlyPrice: parseInt(yearlyPrice),
            currency: "INR",
            eventName: eventName || "",
            eventActive: !!eventName,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      res.json({ message: "Pricing updated successfully" });
    } catch (error) {
      console.error("Error updating pricing:", error);
      res.status(500).json({ error: "Failed to update pricing" });
    }
  });

  // Create quiz (user-generated)
  app.post("/api/user/create-quiz", async (req: Request, res: Response) => {
    try {
      const { title, description, timer, negativeMarking, questions, category } = req.body;

      if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const client = await getMongoClient();
      const db = client.db("quizdb");
      const collection = db.collection("user_quizzes");

      const userId = req.headers["x-user-id"] || `user-${Date.now()}`;

      const quizData = {
        title: title.trim(),
        description: description?.trim() || "",
        category: category || "General Knowledge",
        timer: timer || 15,
        negative_marking: negativeMarking || 0,
        creator_id: userId,
        creator_name: req.headers["x-user-name"] || "User",
        type: "user",
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        questions: questions.map((q: any, idx: number) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: category || "General Knowledge",
          quiz_name: title,
          timer: timer || 15,
          timestamp: new Date().toISOString(),
        })),
      };

      const result = await collection.insertOne(quizData);

      res.json({
        message: "Quiz created successfully",
        quizId: result.insertedId.toString(),
      });
    } catch (error) {
      console.error("Error creating quiz:", error);
      res.status(500).json({
        error: "Failed to create quiz",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
