import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

const getPrisma = (req: AuthRequest) => (req as any).prisma as PrismaClient;

interface OnlineUser {
  userId: string;
  lastActive: number;
}

const onlineUsers = new Map<string, OnlineUser>();
const ACTIVE_TIMEOUT = 30000;

setInterval(() => {
  const now = Date.now();
  onlineUsers.forEach((user, userId) => {
    if (now - user.lastActive > ACTIVE_TIMEOUT) {
      onlineUsers.delete(userId);
    }
  });
}, 10000);

router.post('/heartbeat', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId;
  if (userId) {
    onlineUsers.set(userId, { userId, lastActive: Date.now() });
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

router.get('/', async (req, res) => {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatar: true, points: true, role: true, createdAt: true },
    orderBy: { points: 'desc' },
  });
  res.json(users);
  await prisma.$disconnect();
});

router.get('/rankings', async (req, res) => {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatar: true, points: true },
    orderBy: { points: 'desc' },
  });
  res.json(users);
  await prisma.$disconnect();
});

router.post('/register', async (req, res) => {
  const prisma = new PrismaClient();
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }
  
  const existing = await prisma.user.findFirst({ where: { name } });
  if (existing) {
    await prisma.$disconnect();
    return res.status(400).json({ error: 'Name exists' });
  }
  
  const user = await prisma.user.create({
    data: { name, points: 0 }
  });
  
  res.json({ id: user.id, name: user.name, points: user.points });
  await prisma.$disconnect();
});

router.post('/login', async (req, res) => {
  const prisma = new PrismaClient();
  const { name } = req.body;
  
  if (!name) {
    await prisma.$disconnect();
    return res.status(400).json({ error: 'Name required' });
  }
  
  let user = await prisma.user.findFirst({ where: { name } });
  if (!user) {
    user = await prisma.user.create({
      data: { name, points: 0 }
    });
  }
  
  res.json({ id: user.id, name: user.name, points: user.points });
  await prisma.$disconnect();
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  try {
    let user = await prisma.user.findFirst({ 
      where: { 
        OR: [{ id: req.userId }, { name: req.userId }] 
      } 
    });
    if (!user) {
      user = await prisma.user.create({
        data: { id: req.userId!, name: req.userId!, points: 0 }
      });
    }
    res.json({ id: user.id, name: user.name, avatar: user.avatar, points: user.points });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/me', authenticate, async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { name, avatar, password } = req.body;
  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (avatar !== undefined) data.avatar = avatar;
    if (password !== undefined) data.password = password;
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
    });
    res.json({ id: user.id, name: user.name, avatar: user.avatar });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  try {
    await prisma.user.delete({ where: { id: String(req.params.id) } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const prisma = getPrisma(req);
  const { points, role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { 
        ...(points !== undefined && { points }),
        ...(role && { role }),
      },
    });
    res.json({ id: user.id, name: user.name, points: user.points, role: user.role });
  } catch (e) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/stats', async (req, res) => {
  const prisma = new PrismaClient();
  const totalUsers = await prisma.user.count();
  
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  const activeCheckIns = await prisma.checkIn.findMany({
    where: { timestamp: { gte: twentyFourHoursAgo } },
  });
  
  const activeUserIds = new Set(activeCheckIns.map(c => c.userId));
  
  res.json({ totalUsers, activeUsers: activeUserIds.size });
  await prisma.$disconnect();
});

router.post('/sync-points', async (req, res) => {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany();
    
    for (const user of users) {
      const totalPoints = await prisma.checkIn.aggregate({
        where: { userId: user.id },
        _sum: { points: true }
      });
      
      const calculatedPoints = totalPoints._sum.points || 0;
      
      if (user.points !== calculatedPoints) {
        await prisma.user.update({
          where: { id: user.id },
          data: { points: calculatedPoints }
        });
      }
    }
    
    res.json({ success: true, message: 'Points synced successfully' });
  } catch (e) {
    console.error('Sync error:', e);
    res.status(500).json({ error: 'Failed to sync points' });
  } finally {
    await prisma.$disconnect();
  }
});

router.get('/:id', async (req, res) => {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({
    where: { id: req.params.id }
  });
  if (!user) {
    await prisma.$disconnect();
    return res.status(404).json({ error: 'Not found' });
  }
  res.json({ id: user.id, name: user.name, avatar: user.avatar, points: user.points });
  await prisma.$disconnect();
});

export default router;