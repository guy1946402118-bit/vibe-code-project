const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.user.updateMany({
      where: { name: 'Lan' },
      data: { role: 'ADMIN' }
    });
    console.log('Lan role updated to ADMIN');
    
    const user = await prisma.user.findFirst({ where: { name: 'Lan' } });
    console.log('Lan user:', user);
  } catch (e) {
    console.log('Error:', e.message);
  }
  await prisma.$disconnect();
}

main();
