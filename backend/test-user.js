const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({where: {email: "admin@godownmax.com"}}).then(console.log).finally(() => prisma.$disconnect());
