import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const JWT_SECRET = 'your-secret-key';

router.post('/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.admin.findFirst({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Admin exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { username, password: hashedPassword },
    });

    let user = await prisma.user.findFirst({ where: { name: username } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: admin.id, name: username, role: 'ADMIN' }
      });
    }

    const token = jwt.sign({ adminId: admin.id, userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: 'ADMIN' }, isAdmin: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  } finally {
    await prisma.$disconnect();
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const prisma = new PrismaClient();
  try {
    const admin = await prisma.admin.findFirst({ where: { username } });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let user = await prisma.user.findFirst({ where: { name: username } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: admin.id, name: username, role: 'ADMIN' }
      });
    }

    const token = jwt.sign({ adminId: admin.id, userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points }, isAdmin: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  } finally {
    await prisma.$disconnect();
  }
});

router.post('/user/register', async (req: Request, res: Response) => {
  const { name, password, email, phone, avatar } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findFirst({ where: { name } });
    if (existing) {
      return res.status(400).json({ error: 'Name already exists' });
    }

    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.create({
      data: { 
        name, 
        avatar: avatar || null, 
        points: 0,
        email: email || null,
        phone: phone || null,
        password: hashedPassword
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  } finally {
    await prisma.$disconnect();
  }
});

router.post('/user/login', async (req: Request, res: Response) => {
  const { name, password } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, points: user.points } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed' });
  } finally {
    await prisma.$disconnect();
  }
});

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId?: string; userId?: string };
    const userId = decoded.adminId || decoded.userId;

    const prisma = new PrismaClient();
    const admin = decoded.adminId ? await prisma.admin.findUnique({ where: { id: decoded.adminId } }) : null;
    const user = await prisma.user.findFirst({ 
      where: { 
        OR: [{ id: userId }, { name: userId }] 
      } 
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    res.json({ 
      user: { id: user.id, name: user.name, role: user.role, points: user.points },
      isAdmin: !!admin 
    });
    await prisma.$disconnect();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
