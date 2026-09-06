const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AVATARS = [
  { email: 'marco.bianchi@example.com',    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face' },
  { email: 'laura.romano@example.com',     avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=400&h=400&fit=crop&crop=face' },
  { email: 'alessandro.verdi@example.com', avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face' },
  { email: 'giulia.neri@example.com',      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face' },
  { email: 'francesco.esposito@example.com', avatar: 'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop&crop=face' },
  { email: 'marta.colombo@example.com',    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face' },
];

const GALLERY = [
  { email: 'marco.bianchi@example.com', photos: [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80',
  ]},
  { email: 'laura.romano@example.com', photos: [
    'https://images.unsplash.com/photo-1579684385127-1ef15d558a9a?w=800&q=80',
    'https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800&q=80',
  ]},
  { email: 'alessandro.verdi@example.com', photos: [
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
  ]},
  { email: 'giulia.neri@example.com', photos: [
    'https://images.unsplash.com/photo-1631217868264-e5b964656ff6?w=800&q=80',
    'https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=800&q=80',
  ]},
  { email: 'francesco.esposito@example.com', photos: [
    'https://images.unsplash.com/photo-1530497615207-64d3a683ae56?w=800&q=80',
  ]},
  { email: 'marta.colombo@example.com', photos: [
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80',
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
  ]},
];

async function main() {
  console.log('🖼️  Adding doctor images...\n');

  for (const { email, avatar } of AVATARS) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) { console.log(`  ⚠️  User not found: ${email}`); continue; }
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: avatar } });
    console.log(`  ✅ Avatar set: ${user.name}`);
  }

  for (const { email, photos } of GALLERY) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) continue;
    const profile = await prisma.surgeonProfile.findUnique({ where: { userId: user.id } });
    if (!profile) continue;

    const existing = await prisma.surgeonPhotos.count({ where: { surgeonId: profile.id } });
    if (existing > 0) { console.log(`  ⏭️  Gallery exists: ${profile.name}`); continue; }

    for (let i = 0; i < photos.length; i++) {
      await prisma.surgeonPhotos.create({
        data: { surgeonId: profile.id, url: photos[i], order: i },
      });
    }
    console.log(`  📷 Gallery added: ${profile.name} (${photos.length} photos)`);
  }

  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

main();
