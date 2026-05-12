import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-secret-key';
const PORT = 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const router = express.Router();

router.post('/auth/user/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  try {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/auth/user/register', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  try {
    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) return res.status(400).json({ error: 'Name already exists' });
    
    const user = await prisma.user.create({ data: { name, points: 0 } });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  
  try {
    const admin = await prisma.admin.findFirst({ where: { username } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    let user = await prisma.user.findFirst({ where: { name: username } });
    if (!user) user = await prisma.user.create({ data: { id: admin.id, name: username, role: 'ADMIN' } });
    
    const token = jwt.sign({ adminId: admin.id, userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points }, isAdmin: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.adminId || decoded.userId;
    
    const admin = decoded.adminId ? await prisma.admin.findUnique({ where: { id: decoded.adminId } }) : null;
    const user = await prisma.user.findFirst({ 
      where: { OR: [{ id: userId }, { name: userId }] } 
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      user: { id: user.id, name: user.name, role: user.role, points: user.points },
      isAdmin: !!admin || user.role === 'ADMIN'
    });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

router.get('/users/rankings', async (req, res) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { points: 'desc' }, take: 100 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/checkins/today', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.adminId || decoded.userId;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkIns = await prisma.checkIn.findMany({
      where: { 
        userId,
        timestamp: { gte: today.toISOString(), lt: tomorrow.toISOString() }
      }
    });
    res.json(checkIns);
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/checkins', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.adminId || decoded.userId;
    const { category } = req.body;
    
    const pointsMap = { HEALTH: 10, STUDY: 15, WORK: 15, DISCIPLINE: 20, REVIEW: 25 };
    const points = pointsMap[category as keyof typeof pointsMap] || 10;
    
    const checkIn = await prisma.checkIn.create({
      data: { userId, category, points }
    });
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: points } }
    });
    
    res.json({ checkIn, totalPoints: user.points });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/checkins/stats', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.adminId || decoded.userId;
    
    const checkIns = await prisma.checkIn.findMany({ where: { userId } });
    const totalPoints = checkIns.reduce((sum, c) => sum + c.points, 0);
    
    res.json({ totalCheckIns: checkIns.length, totalPoints, streak: Math.floor(totalPoints / 30) });
  } catch {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
