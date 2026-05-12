const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findFirst({ where: { name: 'testuser' } });
  if (user) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log('Deleted user: testuser');
  } else {
    console.log('User testuser not found');
  }
  await prisma.$disconnect();
})();
