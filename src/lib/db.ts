import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface User {
  id: string;
  name: string;
  avatar?: string;
  points?: number;
  createdAt: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  category: 'HEALTH' | 'STUDY' | 'WORK' | 'DISCIPLINE' | 'REVIEW';
  timestamp: number;
  points: number;
  content?: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  points: number;
}

export interface Reward {
  id: string;
  userId: string;
  name: string;
  pointsCost: number;
  redeemed: boolean;
  createdAt: number;
}

export interface Review {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly';
  content: string;
  createdAt: number;
}

export interface TrainingLog {
  id: string;
  userId: string;
  type: 'meditation' | 'schulte' | 'nbak' | 'memory' | 'stroop' | 'chess';
  points: number;
  detail?: string;
  timestamp: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: number;
  updatedAt: number;
  views: number;
  likes: number;
  isPublished: boolean;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface GrowthDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-created': number };
  };
  checkins: {
    key: string;
    value: CheckIn;
    indexes: { 'by-user': string; 'by-category': string; 'by-timestamp': number };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-user': string; 'by-created': number };
  };
  rewards: {
    key: string;
    value: Reward;
    indexes: { 'by-user': string };
  };
  reviews: {
    key: string;
    value: Review;
    indexes: { 'by-user': string; 'by-created': number };
  };
  traininglogs: {
    key: string;
    value: TrainingLog;
    indexes: { 'by-user': string; 'by-timestamp': number };
  };
  blogposts: {
    key: string;
    value: BlogPost;
    indexes: { 'by-published': number; 'by-category': string };
  };
  blogcategories: {
    key: string;
    value: BlogCategory;
  };
}

const DB_NAME = 'growth-dashboard-v2';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<GrowthDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GrowthDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GrowthDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('by-created', 'createdAt');
          const checkinsStore = db.createObjectStore('checkins', { keyPath: 'id' });
          checkinsStore.createIndex('by-user', 'userId');
          checkinsStore.createIndex('by-category', 'category');
          checkinsStore.createIndex('by-timestamp', 'timestamp');
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('by-user', 'userId');
          notesStore.createIndex('by-created', 'createdAt');
          const rewardsStore = db.createObjectStore('rewards', { keyPath: 'id' });
          rewardsStore.createIndex('by-user', 'userId');
          const reviewsStore = db.createObjectStore('reviews', { keyPath: 'id' });
          reviewsStore.createIndex('by-user', 'userId');
          reviewsStore.createIndex('by-created', 'createdAt');
        }
        if (oldVersion < 2) {
          const blogStore = db.createObjectStore('blogposts', { keyPath: 'id' });
          blogStore.createIndex('by-published', 'publishedAt');
          blogStore.createIndex('by-category', 'category');
          db.createObjectStore('blogcategories', { keyPath: 'id' });
        }
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('traininglogs')) {
            const trainingStore = db.createObjectStore('traininglogs', { keyPath: 'id' });
            trainingStore.createIndex('by-user', 'userId');
            trainingStore.createIndex('by-timestamp', 'timestamp');
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function createUser(name: string): Promise<User> {
  const db = await getDB();
  const user: User = {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
  };
  await db.put('users', user);
  return user;
}

export async function getUser(id: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get('users', id);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return db.getAllFromIndex('users', 'by-created');
}

export async function updateUserInDB(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function addCheckIn(userId: string, category: CheckIn['category'], content?: string): Promise<CheckIn> {
  const db = await getDB();
  const pointsMap = { HEALTH: 10, STUDY: 15, WORK: 15, DISCIPLINE: 20, REVIEW: 25 };
  const checkin: CheckIn = {
    id: crypto.randomUUID(),
    userId,
    category,
    timestamp: Date.now(),
    points: pointsMap[category],
    content,
  };
  await db.put('checkins', checkin);
  return checkin;
}

export async function getCheckIns(userId: string, startTime?: number, endTime?: number): Promise<CheckIn[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('checkins', 'by-user', userId);
  return all.filter(c => (!startTime || c.timestamp >= startTime) && (!endTime || c.timestamp <= endTime));
}

export async function addNote(userId: string, title: string, content: string, tags: string[] = []): Promise<Note> {
  const db = await getDB();
  const note: Note = {
    id: crypto.randomUUID(),
    userId,
    title,
    content,
    tags,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    points: 5,
  };
  await db.put('notes', note);
  return note;
}

export async function getNotes(userId: string): Promise<Note[]> {
  const db = await getDB();
  return db.getAllFromIndex('notes', 'by-user', userId);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function addReward(userId: string, name: string, pointsCost: number): Promise<Reward> {
  const db = await getDB();
  const reward: Reward = {
    id: crypto.randomUUID(),
    userId,
    name,
    pointsCost,
    redeemed: false,
    createdAt: Date.now(),
  };
  await db.put('rewards', reward);
  return reward;
}

export async function getRewards(userId: string): Promise<Reward[]> {
  const db = await getDB();
  return db.getAllFromIndex('rewards', 'by-user', userId);
}

export async function redeemReward(rewardId: string): Promise<void> {
  const db = await getDB();
  const reward = await db.get('rewards', rewardId);
  if (reward) {
    reward.redeemed = true;
    await db.put('rewards', reward);
  }
}

export async function addReview(userId: string, type: Review['type'], content: string): Promise<Review> {
  const db = await getDB();
  const review: Review = {
    id: crypto.randomUUID(),
    userId,
    type,
    content,
    createdAt: Date.now(),
  };
  await db.put('reviews', review);
  return review;
}

export async function getReviews(userId: string): Promise<Review[]> {
  const db = await getDB();
  return db.getAllFromIndex('reviews', 'by-user', userId);
}

export async function createBlogPost(post: Omit<BlogPost, 'id' | 'views' | 'likes'>): Promise<BlogPost> {
  const db = await getDB();
  const newPost: BlogPost = {
    ...post,
    id: crypto.randomUUID(),
    views: 0,
    likes: 0,
  };
  await db.put('blogposts', newPost);
  return newPost;
}

export async function updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | undefined> {
  const db = await getDB();
  const post = await db.get('blogposts', id);
  if (!post) return undefined;
  const updated = { ...post, ...updates, updatedAt: Date.now() };
  await db.put('blogposts', updated);
  return updated;
}

export async function deleteBlogPost(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('blogposts', id);
}

export async function getBlogPost(id: string): Promise<BlogPost | undefined> {
  const db = await getDB();
  const post = await db.get('blogposts', id);
  if (post) {
    post.views += 1;
    await db.put('blogposts', post);
  }
  return post;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
  const db = await getDB();
  const posts = await db.getAll('blogposts');
  const post = posts.find(p => p.slug === slug);
  if (post) {
    post.views += 1;
    await db.put('blogposts', post);
  }
  return post;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const db = await getDB();
  const posts = await db.getAll('blogposts');
  return posts
    .filter(p => p.isPublished)
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const db = await getDB();
  const posts = await db.getAllFromIndex('blogposts', 'by-category', category);
  return posts.filter(p => p.isPublished).sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const db = await getDB();
  return db.getAll('blogcategories');
}

export async function addBlogCategory(category: BlogCategory): Promise<void> {
  const db = await getDB();
  await db.put('blogcategories', category);
}

export async function searchBlogPosts(query: string): Promise<BlogPost[]> {
  const db = await getDB();
  const posts = await db.getAll('blogposts');
  const q = query.toLowerCase();
  return posts
    .filter(p => p.isPublished && (
      p.title.toLowerCase().includes(q) || 
      p.content.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q)
    ))
    .sort((a, b) => b.publishedAt - a.publishedAt);
}

export async function addTrainingLog(userId: string, type: TrainingLog['type'], points: number, detail?: string): Promise<TrainingLog> {
  const db = await getDB();
  const log: TrainingLog = {
    id: crypto.randomUUID(),
    userId,
    type,
    points,
    detail,
    timestamp: Date.now(),
  };
  await db.put('traininglogs', log);
  return log;
}

export async function getTrainingLogs(userId: string, startTime?: number, endTime?: number): Promise<TrainingLog[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('traininglogs', 'by-user', userId);
  return all
    .filter(l => (!startTime || l.timestamp >= startTime) && (!endTime || l.timestamp <= endTime))
    .sort((a, b) => b.timestamp - a.timestamp);
}