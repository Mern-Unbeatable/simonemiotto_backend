const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const SUBSCRIPTION_PLANS = [
  {
    name: 'Basic',
    description: 'Piano base per chirurghi alle prime armi',
    durationDays: 30,
    price: 29.99,
    features: ['Profilo base', 'Fino a 5 foto portfolio', 'Supporto email'],
    verifiedBadge: false,
    autoRenew: true,
  },
  {
    name: 'Standard',
    description: 'Il piano più popolare per chirurghi affermati',
    durationDays: 30,
    price: 59.99,
    features: ['Profilo avanzato', 'Fino a 15 foto portfolio', 'Supporto prioritario', 'Statistiche visite'],
    verifiedBadge: false,
    autoRenew: true,
  },
  {
    name: 'Advanced',
    description: 'Per professionisti che vogliono massima visibilità',
    durationDays: 30,
    price: 99.99,
    features: ['Profilo premium', 'Foto illimitate', 'Supporto telefonico', 'Analytics avanzati', 'Posizione in evidenza'],
    verifiedBadge: false,
    autoRenew: true,
  },
  {
    name: 'Premium',
    description: 'Il piano definitivo con badge d\'oro e massima esposizione',
    durationDays: 30,
    price: 149.99,
    features: ['Badge Premium dorato', 'Foto illimitate', 'Supporto dedicato 24/7', 'Analytics completi', 'Primo in ricerca', 'Verifica identità accelerata'],
    verifiedBadge: true,
    autoRenew: true,
  },
];

const CLINICS = [
  { name: 'Clinica San Raffaele', city: 'Milano' },
  { name: 'Policlinico Universitario A. Gemelli', city: 'Roma' },
  { name: 'Ospedale San Paolo', city: 'Milano' },
  { name: 'Clinica Giustiniano', city: 'Roma' },
  { name: 'Istituto Clinico Humanitas', city: 'Rozzano' },
  { name: 'Ospedale Pediatrico Bambino Gesù', city: 'Roma' },
  { name: 'Clinica Fornaroli', city: 'Milano' },
  { name: 'Centro Chirurgico Toscano', city: 'Firenze' },
  { name: 'Clinica del Sole', city: 'Napoli' },
];

const SURGEON_PROFILES = [
  {
    name: 'Dr. Marco Bianchi',
    email: 'marco.bianchi@example.com',
    phone: '+39 02 1234567',
    specialization: 'Chirurgia Plastica',
    experienceYears: 15,
    language: 'Italiano, Inglese',
    bio: 'Specializzato in chirurgia plastica reconstructiva ed estetica con oltre 15 anni di esperienza. Membro della Società Italiana di Chirurgia Plastica.',
    patientApproach: 'Credo in una comunicazione aperta e trasparente con i miei pazienti, prendendomi il tempo necessario per comprendere le loro esigenze e aspettative.',
    education: ['Laurea in Medicina e Chirurgia - Università degli Studi di Milano', 'Specializzazione in Chirurgia Plastica - Ospedale San Paolo', 'Fellowship in Chirurgia Estetica - Paris'],
    areasExpertise: ['Chirurgia Estetica', 'Chirurgia Ricognitiva', 'Riabilitazione', 'Chirurgia della Mano'],
    certifications: ['Specialista in Chirurgia Plastica', 'Membro SICPRE', 'ISAPS Member'],
    procedures: [
      { title: 'Chirurgia Estetica', treatments: ['Rinoplastica', 'Lifting', 'Liposcuzione', 'Blefaroplastica'] },
      { title: 'Chirurgia Ricognitiva', treatments: ['Ricostruzione mammaria', 'Trapianto di cute', 'Chirurgia della mano'] },
    ],
    boardRegistrationNumber: 'MED/001234',
    city: 'Milano',
    clinic: 'Clinica San Raffaele',
  },
  {
    name: 'Dott.ssa Laura Romano',
    email: 'laura.romano@example.com',
    phone: '+39 06 7654321',
    specialization: 'Ortopedia',
    experienceYears: 12,
    language: 'Italiano, Inglese, Spagnolo',
    bio: 'Ortopedista specializzata in chirurgia protesica dell\'anca e del ginocchio. Appassionata di medicina sportiva e recupero funzionale.',
    patientApproach: 'Il mio obiettivo è restituire la qualità della vita ai miei pazienti attraverso approcci minimamente invasivi e piani di riabilitazione personalizzati.',
    education: ['Laurea in Medicina e Chirurgia - Università La Sapienza', 'Specializzazione in Ortopedia e Traumatologia - Policlinico Gemelli', 'Master in Medicina Sportiva'],
    areasExpertise: ['Protesi d\'Anca', 'Protesi di Ginocchio', 'Chirurgia Artroscopica', 'Medicina Sportiva'],
    certifications: ['Specialista in Ortopedia', 'SICOT Member', 'Certificazione in Artroscopia'],
    procedures: [
      { title: 'Protesi Articolari', treatments: ['Protesi d\'anca', 'Protesi di ginocchio', 'Protesi di spalla'] },
      { title: 'Chirurgia Sportiva', treatments: ['Ricostruzione LCA', 'Meniscectomia', 'Riparazione tendinei'] },
    ],
    boardRegistrationNumber: 'MED/005678',
    city: 'Roma',
    clinic: 'Policlinico Universitario A. Gemelli',
  },
  {
    name: 'Dr. Alessandro Verdi',
    email: 'alessandro.verdi@example.com',
    phone: '+39 055 9876543',
    specialization: 'Oftalmologia',
    experienceYears: 20,
    language: 'Italiano, Inglese',
    bio: 'Oculista con due decenni di esperienza in chirurgia refrattiva e cataratta. Pioniere nelle tecniche laser di ultima generazione in Toscana.',
    patientApproach: 'Fornisco cure personalizzate basate sulle più recenti evidenze scientifiche, con particolare attenzione al comfort e alla sicurezza del paziente.',
    education: ['Laurea in Medicina e Chirurgia - Università di Firenze', 'Specializzazione in Oftalmologia - Clinica Fornaroli', 'Fellowship in Chirurgia Refrattiva - USA'],
    areasExpertise: ['Chirurgia della Cataratta', 'Laser Excimer', 'Trapianto di Cornea', 'Glaucoma'],
    certifications: ['Specialista in Oftalmologia', 'ESCRS Member', 'AISO Member'],
    procedures: [
      { title: 'Chirurgia Refrattiva', treatments: ['LASIK', 'PRK', 'SMILE', 'Implantazione ICL'] },
      { title: 'Chirurgia della Cataratta', treatments: ['Facoemulsificazione', 'Impianto multifocale', 'Impianto torico'] },
    ],
    boardRegistrationNumber: 'MED/009012',
    city: 'Firenze',
    clinic: 'Centro Chirurgico Toscano',
  },
  {
    name: 'Dott.ssa Giulia Neri',
    email: 'giulia.neri@example.com',
    phone: '+39 02 8765432',
    specialization: 'Chirurgia Maxillo-Facciale',
    experienceYears: 10,
    language: 'Italiano, Inglese, Francese',
    bio: 'Chirurga maxillo-facciale specializzata in chirurgia ortognatica e revisione estetica del viso. Esperienza internazionale in centri di eccellenza.',
    patientApproach: 'Ascolto attentamente i desideri dei miei pazienti e li guido verso soluzioni chirurgiche sicure ed efficaci, con risultati naturali.',
    education: ['Laurea in Odontoiatria - Università di Milano', 'Specializzazione in Chirurgia Maxillo-Facciale - Ospedale San Paolo', 'Master in Chirurgia Ortognatica'],
    areasExpertise: ['Chirurgia Ortognatica', 'Chirurgia Estetica del Viso', 'Ricostruzione Mandibolare', 'Implantologia'],
    certifications: ['Specialista in Chirurgia Maxillo-Facciale', 'SICMF Member', 'IAOMS Member'],
    procedures: [
      { title: 'Chirurgia Ortognatica', treatments: ['Osteotomia mascellare', 'Osteotomia mandibolare', 'Chirurgia bimaxillare'] },
      { title: 'Estetica del Viso', treatments: ['Rinoplastica', 'Mentoplastica', 'Otoplastica', 'Blefaroplastica'] },
    ],
    boardRegistrationNumber: 'MED/003456',
    city: 'Milano',
    clinic: 'Clinica Fornaroli',
  },
  {
    name: 'Dr. Francesco Esposito',
    email: 'francesco.esposito@example.com',
    phone: '+39 081 5551234',
    specialization: 'Urologia',
    experienceYears: 18,
    language: 'Italiano, Inglese',
    bio: 'Urologo specializzato in chirurgia minimamente invasiva e robotica. Responsabile dell\'unità di urologia presso l\'Ospedale Universitario.',
    patientApproach: 'Combino competenze tecniche avanzate con un approccio umano e empatico, garantendo ai miei pazienti il massimo standard di cura.',
    education: ['Laurea in Medicina e Chirurgia - Università Federico II', 'Specializzazione in Urologia - Ospedale Cardarelli', 'Fellowship in Urologia Robotica - Cleveland Clinic'],
    areasExpertise: ['Urologia Robotica', 'Prostatectomia', 'Nefrectomia', 'Urologia Oncologica'],
    certifications: ['Specialista in Urologia', 'EAU Member', 'Certificazione Da Vinci Robot'],
    procedures: [
      { title: 'Chirurgia Robotica', treatments: ['Prostatectomia robotica', 'Nefrectomia parziale', 'Cistectomia'] },
      { title: 'Urologia Generale', treatments: ['TURP', 'Litotripsia', 'Varicocelectomia'] },
    ],
    boardRegistrationNumber: 'MED/007890',
    city: 'Napoli',
    clinic: 'Clinica del Sole',
  },
  {
    name: 'Dott.ssa Marta Colombo',
    email: 'marta.colombo@example.com',
    phone: '+39 02 3334444',
    specialization: 'Ginecologia',
    experienceYears: 14,
    language: 'Italiano, Inglese, Tedesco',
    bio: 'Ginecologa specializzata in ginecologia oncologica e chirurgia minimamente invasiva. Promuovere la salute femminile come priorità assoluta.',
    patientApproach: 'Credo nella medicina personalizzata e nella prevenzione. Ogni paziente è unica e merita un percorso di cura su misura.',
    education: ['Laurea in Medicina e Chirurgia - Università Statale di Milano', 'Specializzazione in Ginecologia - Istituto Carlo Besta', 'Master in Ginecologia Oncologica'],
    areasExpertise: ['Ginecologia Oncologica', 'Chirurgia Laparoscopica', 'Endoscopia Ginecologica', 'Medicina della Riproduzione'],
    certifications: ['Specialista in Ginecologia', 'AAGL Member', 'SIGO Member'],
    procedures: [
      { title: 'Chirurgia Ginecologica', treatments: ['Isterectomia', 'Miomectomia', 'Ovariectomia', 'Laparoscopia diagnostica'] },
      { title: 'Oncologia Ginecologica', treatments: ['Esportazione utero', 'Linfadenectomia', 'Chirurgia conservativa'] },
    ],
    boardRegistrationNumber: 'MED/002345',
    city: 'Milano',
    clinic: 'Ospedale San Paolo',
  },
];

async function main() {
  try {
    console.log('🏥 Starting example surgeon profiles seed...\n');

    // 1. Create subscription plans
    console.log('📋 Creating subscription plans...');
    const planIdMap = new Map();
    for (const plan of SUBSCRIPTION_PLANS) {
      const existing = await prisma.subscriptionTier.findUnique({ where: { name: plan.name } });
      if (existing) {
        planIdMap.set(plan.name, existing.id);
        console.log(`  ✅ Plan already exists: ${plan.name}`);
      } else {
        const created = await prisma.subscriptionTier.create({ data: plan });
        planIdMap.set(plan.name, created.id);
        console.log(`  🆕 Created plan: ${plan.name} (€${plan.price}, verifiedBadge: ${plan.verifiedBadge})`);
      }
    }

    // 2. Create clinics
    console.log('\n🏢 Creating clinics...');
    const clinicIdMap = new Map();
    for (const clinic of CLINICS) {
      const existing = await prisma.clinic.findUnique({ where: { name: clinic.name } });
      if (existing) {
        clinicIdMap.set(clinic.name, existing.id);
        console.log(`  ✅ Clinic already exists: ${clinic.name}`);
      } else {
        // Find the city
        const city = await prisma.city.findFirst({ where: { name: clinic.city } });
        if (!city) {
          console.log(`  ⚠️  City not found: ${clinic.city}, skipping clinic: ${clinic.name}`);
          continue;
        }
        const created = await prisma.clinic.create({
          data: {
            name: clinic.name,
            slug: slugify(clinic.name),
            cityId: city.id,
          },
        });
        clinicIdMap.set(clinic.name, created.id);
        console.log(`  🆕 Created clinic: ${clinic.name} (${clinic.city})`);
      }
    }

    // 3. Create surgeon profiles
    console.log('\n👨‍⚕️ Creating surgeon profiles...');
    let createdCount = 0;
    let existingCount = 0;

    for (const surgeon of SURGEON_PROFILES) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: surgeon.email.toLowerCase() },
      });

      if (existingUser) {
        existingCount++;
        console.log(`  ✅ Surgeon already exists: ${surgeon.name}`);
        continue;
      }

      // Find city
      const city = await prisma.city.findFirst({ where: { name: surgeon.city } });
      if (!city) {
        console.log(`  ⚠️  City not found: ${surgeon.city}, skipping: ${surgeon.name}`);
        continue;
      }

      // Find clinic
      const clinicId = surgeon.clinic ? clinicIdMap.get(surgeon.clinic) : null;
      if (surgeon.clinic && !clinicId) {
        console.log(`  ⚠️  Clinic not found: ${surgeon.clinic}, skipping: ${surgeon.name}`);
        continue;
      }

      // Get a plan (assign Premium to first 2, Advanced to next 2, Standard to rest)
      const planIndex = SURGEON_PROFILES.indexOf(surgeon);
      const planName = planIndex < 2 ? 'Premium' : planIndex < 4 ? 'Advanced' : 'Standard';
      const planId = planIdMap.get(planName);

      const hashedPassword = await bcrypt.hash('Surgeon@123', 10);

      // Create user + profile in transaction
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: surgeon.name,
            email: surgeon.email.toLowerCase(),
            passwordHash: hashedPassword,
            phone: surgeon.phone,
            role: 'SURGEON',
            status: 'ACTIVE',
            emailVerified: true,
          },
        });

        const baseSlug = slugify(surgeon.name);
        const shortId = Math.floor(10000 + Math.random() * 90000);
        const slug = `${baseSlug}-${shortId}`;

        const profile = await tx.surgeonProfile.create({
          data: {
            userId: user.id,
            name: surgeon.name,
            slug,
            bio: surgeon.bio,
            specialization: surgeon.specialization,
            experienceYears: surgeon.experienceYears,
            experience: `${surgeon.experienceYears} anni di esperienza`,
            language: surgeon.language,
            patientApproach: surgeon.patientApproach,
            education: surgeon.education,
            areasExpertise: surgeon.areasExpertise,
            certifications: surgeon.certifications,
            procedures: surgeon.procedures || [],
            boardRegistrationNumber: surgeon.boardRegistrationNumber,
            cityId: city.id,
            clinicId: clinicId,
            isVerified: true,
            status: 'APPROVED',
            paymentStatus: 'ACTIVE',
          },
        });

        // Create active subscription
        if (planId) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);

          const subscription = await tx.subscription.create({
            data: {
              subscriptionTierId: planId,
              surgeonProfileId: profile.id,
              status: 'ACTIVE',
              startDate,
              endDate,
              autoRenew: true,
            },
          });

          await tx.surgeonProfile.update({
            where: { id: profile.id },
            data: { currentSubscriptionId: subscription.id },
          });
        }
      });

      createdCount++;
      console.log(`  🆕 Created surgeon: ${surgeon.name} (${surgeon.specialization}) - Plan: ${planName}`);
    }

    console.log('\n========================================');
    console.log('👨‍⚕️ Example surgeon profiles seed completed!');
    console.log('========================================');
    console.log(`Plans:       ${SUBSCRIPTION_PLANS.length}`);
    console.log(`Clinics:     ${clinicIdMap.size}`);
    console.log(`Surgeons:    created=${createdCount}, existing=${existingCount}`);
    console.log('========================================');
    console.log('\n📝 Login credentials for all surgeons: Surgeon@123');
  } catch (error) {
    console.error('❌ Error seeding surgeon profiles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
