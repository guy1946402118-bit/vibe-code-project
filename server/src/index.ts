import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import checkInRouter from './routes/checkIn.js';
import noteRouter from './routes/note.js';
import rewardRouter from './routes/reward.js';
import reviewRouter from './routes/review.js';
import trainingRouter from './routes/training.js';
import blogRouter from './routes/blog.js';
import cmsRouter from './routes/cms.js';
import visitorRouter from './routes/visitor.js';
import notificationRouter from './routes/notifications.js';
import followRouter from './routes/follows.js';
import goalRouter from './routes/goal.js';
import skillRouter from './routes/skills.js';
import { errorHandler } from './middleware/errorHandler.js';
import knowledgeRouter from './routes/knowledge.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const prisma = new PrismaClient();

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  (req as any).prisma = prisma;
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/checkins', checkInRouter);
app.use('/api/notes', noteRouter);
app.use('/api/rewards', rewardRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/training', trainingRouter);
app.use('/api/blog', blogRouter);
app.use('/api/cms', cmsRouter);
app.use('/api/visitors', visitorRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/follows', followRouter);
app.use('/api/goals', goalRouter);
app.use('/api/skills', skillRouter);
app.use('/api/knowledge', knowledgeRouter);

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/visitors')) {
    return next();
  }

  const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
                   req.headers['x-real-ip']?.toString() ||
                   req.socket?.remoteAddress ||
                   'unknown';

  const userAgent = req.headers['user-agent']?.toString() || '';
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'desktop';
  let country = null;
  let city = null;

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'Mac OS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) { os = 'Android'; device = 'mobile'; }
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) { os = 'iOS'; device = userAgent.includes('iPad') ? 'tablet' : 'mobile'; }

  if (clientIP === '::1' || clientIP === '127.0.0.1') {
    country = '本地';
    city = 'localhost';
  }

  try {
    await prisma.visitor.create({
      data: {
        ip: clientIP.replace('::ffff:', ''),
        path: req.path,
        browser,
        os,
        device,
        country,
        city,
      },
    });
  } catch (e) {
    console.error('Failed to record visitor:', e);
  }

  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Growth Dashboard API', version: '1.0.0', endpoints: ['/api/auth/login', '/api/users', '/api/checkins'] });
});

app.post('/test-login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Test route received:', username, password);
  res.json({ received: { username, password } });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };