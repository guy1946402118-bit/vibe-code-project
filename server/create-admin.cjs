const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    const existing = await prisma.admin.findFirst({ where: { username: 'Lan' } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('Wcnmsb123456', 10);
      await prisma.admin.create({
        data: { username: 'Lan', password: hashedPassword }
      });
      console.log('Admin Lan created');
    } else {
      console.log('Admin Lan already exists');
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

main();
