const { PrismaClient } = require('@prisma/client');

const schema = `
ALTER TABLE User ADD COLUMN email TEXT;
ALTER TABLE User ADD COLUMN phone TEXT;
ALTER TABLE User ADD COLUMN password TEXT;
`;

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN email TEXT;`.catch(() => {});
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN phone TEXT;`.catch(() => {});
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN password TEXT;`.catch(() => {});
    console.log('Database columns added');
  } catch (e) {
    console.log('Columns may already exist:', e.message);
  }
  
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Wcnmsb123456', 10);
    
    const existingAdmin = await prisma.admin.findFirst({ where: { username: 'Lan' } });
    if (!existingAdmin) {
      const admin = await prisma.admin.create({
        data: { username: 'Lan', password: hashedPassword }
      });
      await prisma.user.create({
        data: { id: admin.id, name: 'Lan', role: 'ADMIN' }
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
