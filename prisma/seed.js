const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seed...');

    // Seed Admin User
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@1234';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log(`✅ Admin user already exists: ${adminEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      const admin = await prisma.user.create({
        data: {
          name: 'Admin User',
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          isActive: true,
          profileStep: 5,
        },
      });

      console.log(`✅ Admin user created successfully!`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   ID: ${admin.id}`);
    }

    console.log('✅ Database seed completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
