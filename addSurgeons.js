const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function seedSurgeons() {
  try {
    console.log('Seeding Italian surgeons...');
    
    // Check if city exists
    let city = await prisma.city.findFirst({ where: { name: 'Roma' } });
    if (!city) {
      const region = await prisma.region.create({ data: { name: 'Lazio', slug: 'lazio' } });
      const province = await prisma.province.create({ data: { name: 'Roma', slug: 'roma', regionId: region.id } });
      city = await prisma.city.create({ data: { name: 'Roma', slug: 'roma', provinceId: province.id } });
    }

    let clinic = await prisma.clinic.findFirst({ where: { name: 'Clinica Roma Centrale' } });
    if (!clinic) {
      clinic = await prisma.clinic.create({ data: { name: 'Clinica Roma Centrale', slug: 'clinica-roma-centrale', cityId: city.id } });
    }

    const surgeons = [
      {
        name: 'Dr. Alessandro Conti',
        email: 'alessandro.conti@example.it',
        specialization: 'Chirurgia Plastica',
      },
      {
        name: 'Dr.ssa Giulia Romano',
        email: 'giulia.romano@example.it',
        specialization: 'Chirurgia Generale',
      }
    ];

    for (let s of surgeons) {
      const userExists = await prisma.user.findUnique({ where: { email: s.email } });
      if (!userExists) {
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const user = await prisma.user.create({
          data: {
            name: s.name,
            email: s.email,
            passwordHash,
            role: 'SURGEON',
            status: 'ACTIVE',
            emailVerified: true
          }
        });

        await prisma.surgeonProfile.create({
          data: {
            userId: user.id,
            clinicId: clinic.id,
            cityId: city.id,
            name: s.name,
            slug: s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            specialization: s.specialization,
            experience: '15 anni di esperienza presso le migliori cliniche in Italia.',
            education: ['Università La Sapienza, Roma', 'Specializzazione in ' + s.specialization],
            language: 'Italiano, Inglese',
            areasExpertise: ['Rinoplastica', 'Mastoplastica additiva'],
            patientApproach: 'Un approccio personalizzato incentrato sulle esigenze specifiche del paziente.',
            experienceYears: 15,
            isVerified: true,
            status: 'APPROVED',
            paymentStatus: 'ACTIVE'
          }
        });
        console.log(`Created surgeon: ${s.name}`);
      }
    }
    
    console.log('Surgeons seeded successfully.');
  } catch (err) {
    console.error('Error seeding surgeons:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSurgeons();
