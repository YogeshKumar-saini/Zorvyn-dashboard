import { PrismaClient, Role, UserStatus, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data (preserving audit logs for history if needed, but here we clean all)
  await prisma.auditLog.deleteMany();
  await prisma.financialRecord.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('Password@123!', 12);

  // 2. Create System Personas
  console.log('👤 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@zorvyn.com',
        password,
        name: 'System Admin',
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      }
    }),
    prisma.user.create({
      data: {
        email: 'analyst@zorvyn.com',
        password,
        name: 'Data Analyst',
        role: Role.ANALYST,
        status: UserStatus.ACTIVE,
      }
    }),
    prisma.user.create({
      data: {
        email: 'viewer@zorvyn.com',
        password,
        name: 'Corporate Viewer',
        role: Role.VIEWER,
        status: UserStatus.ACTIVE,
      }
    })
  ]);

  const admin = users[0];

  // 3. Create Sample Records
  console.log('💰 Creating financial records...');
  
  await prisma.financialRecord.createMany({
    data: [
      { amount: 12500.50, type: RecordType.INCOME, category: 'Consulting', date: new Date('2026-03-15'), createdBy: admin.id },
      { amount: 8000.00, type: RecordType.INCOME, category: 'Sales', date: new Date('2026-03-20'), createdBy: admin.id },
      { amount: 4500.00, type: RecordType.EXPENSE, category: 'Cloud Infrastructure', date: new Date('2026-04-01'), createdBy: admin.id },
      { amount: 2000.00, type: RecordType.EXPENSE, category: 'Office Rent', date: new Date('2026-04-05'), createdBy: admin.id },
    ]
  });

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
