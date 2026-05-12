const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN email TEXT;`.catch(() => console.log('email column may exist'));
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN phone TEXT;`.catch(() => console.log('phone column may exist'));
    await prisma.$executeRaw`ALTER TABLE User ADD COLUMN password TEXT;`.catch(() => console.log('password column may exist'));
    console.log('Database columns added');
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

main();
