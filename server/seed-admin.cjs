import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const existingAdmin = await prisma.admin.findFirst({ where: { username: 'Lan' } });
    if (existingAdmin) {
      console.log('Admin Lan already exists');
    } else {
      const hashedPassword = await bcrypt.hash('Wcnmsb123456', 10);
      const admin = await prisma.admin.create({
        data: { username: 'Lan', password: hashedPassword }
      });
      
      const existingUser = await prisma.user.findFirst({ where: { name: 'Lan' } });
      if (!existingUser) {
        await prisma.user.create({
          data: { id: admin.id, name: 'Lan', role: 'ADMIN' }
        });
      }
      console.log('Admin Lan created successfully');
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
