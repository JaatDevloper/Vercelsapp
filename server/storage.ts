import { type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";
import { db as firebaseDb } from "./firebase";

// Quiz result and other data types that were implicitly handled by MongoDB
export interface QuizResult {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface Room {
  id: string;
  code: string;
  quizId: string;
  hostId: string;
  participants: any[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: string;
}

export interface IStorage {
  // User Profile methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz Result methods
  saveQuizResult(result: Omit<QuizResult, "id">): Promise<QuizResult>;
  getQuizResults(userId: string): Promise<QuizResult[]>;
  
  // Room methods
  createRoom(room: Omit<Room, "id">): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(id: string, updates: Partial<Room>): Promise<Room>;
}

export class FirebaseStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private rooms: Map<string, Room> = new Map();
  private results: Map<string, QuizResult> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    if (firebaseDb) {
      const doc = await firebaseDb.collection("appprofile").doc(id).get();
      return doc.exists ? (doc.data() as User) : undefined;
    }
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (firebaseDb) {
      const snapshot = await firebaseDb.collection("appprofile")
        .where("username", "==", username)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as User;
      }
    }
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, role: "user", isPremium: false };
    
    if (firebaseDb) {
      await firebaseDb.collection("appprofile").doc(id).set(user);
    }
    this.users.set(id, user);
    return user;
  }

  async saveQuizResult(data: Omit<QuizResult, "id">): Promise<QuizResult> {
    const id = randomUUID();
    const result: QuizResult = { ...data, id };
    
    if (firebaseDb) {
      await firebaseDb.collection("quiz_results").doc(id).set(result);
    }
    this.results.set(id, result);
    return result;
  }

  async getQuizResults(userId: string): Promise<QuizResult[]> {
    if (firebaseDb) {
      const snapshot = await firebaseDb.collection("quiz_results")
        .where("userId", "==", userId)
        .get();
      return snapshot.docs.map(doc => doc.data() as QuizResult);
    }
    return Array.from(this.results.values()).filter(r => r.userId === userId);
  }

  async createRoom(data: Omit<Room, "id">): Promise<Room> {
    const id = randomUUID();
    const room: Room = { ...data, id };
    
    if (firebaseDb) {
      await firebaseDb.collection("rooms").doc(id).set(room);
    }
    this.rooms.set(id, room);
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    if (firebaseDb) {
      const snapshot = await firebaseDb.collection("rooms")
        .where("code", "==", code)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        return snapshot.docs[0].data() as Room;
      }
    }
    return Array.from(this.rooms.values()).find(r => r.code === code);
  }

  async updateRoom(id: string, updates: Partial<Room>): Promise<Room> {
    if (firebaseDb) {
      await firebaseDb.collection("rooms").doc(id).update(updates);
      const doc = await firebaseDb.collection("rooms").doc(id).get();
      return doc.data() as Room;
    }
    const existing = this.rooms.get(id);
    if (!existing) throw new Error("Room not found");
    const updated = { ...existing, ...updates };
    this.rooms.set(id, updated);
    return updated;
  }
}

export const storage = new FirebaseStorage();
