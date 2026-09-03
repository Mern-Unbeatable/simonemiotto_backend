const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function main() {
  try {
    console.log('🇮🇹 Starting Italian locations seed...\n');

    const filePath = path.join(__dirname, 'comuni.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const comuni = JSON.parse(raw);

    console.log(`📦 Loaded ${comuni.length} comuni from comuni.json\n`);

    // --- 1. Extract unique regions ---
    const regionsMap = new Map();
    for (const c of comuni) {
      const r = c.regione;
      if (r && r.nome && !regionsMap.has(r.nome)) {
        regionsMap.set(r.nome, { name: r.nome, istatCode: r.codice });
      }
    }
    console.log(`📍 Found ${regionsMap.size} unique regions`);

    // Insert regions
    const regionIdMap = new Map();
    for (const [name, data] of regionsMap) {
      const slug = slugify(name);
      const existing = await prisma.region.findFirst({ where: { name } });
      if (existing) {
        regionIdMap.set(name, existing.id);
        console.log(`  ✅ Region already exists: ${name}`);
      } else {
        const created = await prisma.region.create({ data: { name, slug } });
        regionIdMap.set(name, created.id);
        console.log(`  🆕 Created region: ${name}`);
      }
    }

    // --- 2. Extract unique provinces ---
    const provincesMap = new Map();
    for (const c of comuni) {
      const p = c.provincia;
      const r = c.regione;
      if (p && p.nome && r && r.nome) {
        const key = `${p.nome}|${r.nome}`;
        if (!provincesMap.has(key)) {
          provincesMap.set(key, {
            name: p.nome,
            regionName: r.nome,
            istatCode: p.codice,
          });
        }
      }
    }
    console.log(`📍 Found ${provincesMap.size} unique provinces`);

    // Insert provinces
    const provinceIdMap = new Map();
    for (const [key, data] of provincesMap) {
      const slug = slugify(data.name);
      const regionId = regionIdMap.get(data.regionName);
      if (!regionId) {
        console.log(`  ⚠️  Region not found for province: ${data.name} (${data.regionName})`);
        continue;
      }
      const existing = await prisma.province.findFirst({
        where: { name: data.name, regionId },
      });
      if (existing) {
        provinceIdMap.set(key, existing.id);
        console.log(`  ✅ Province already exists: ${data.name} (${data.regionName})`);
      } else {
        const created = await prisma.province.create({
          data: { name: data.name, slug, regionId },
        });
        provinceIdMap.set(key, created.id);
        console.log(`  🆕 Created province: ${data.name} (${data.regionName})`);
      }
    }

    // --- 3. Insert cities ---
    let createdCount = 0;
    let existingCount = 0;
    let skippedCount = 0;

    console.log(`\n🏙️  Inserting ${comuni.length} cities...\n`);

    for (let i = 0; i < comuni.length; i++) {
      const c = comuni[i];
      const p = c.provincia;
      const r = c.regione;

      if (!p || !p.nome || !r || !r.nome) {
        skippedCount++;
        continue;
      }

      const provinceKey = `${p.nome}|${r.nome}`;
      const provinceId = provinceIdMap.get(provinceKey);

      if (!provinceId) {
        skippedCount++;
        continue;
      }

      const name = c.nome;
      const slug = slugify(name);

      try {
        const existing = await prisma.city.findFirst({
          where: { name, provinceId },
        });

        if (existing) {
          existingCount++;
        } else {
          await prisma.city.create({
            data: { name, slug, provinceId },
          });
          createdCount++;
        }
      } catch (err) {
        skippedCount++;
      }

      // Progress indicator every 500
      if ((i + 1) % 500 === 0) {
        console.log(`  Progress: ${i + 1}/${comuni.length} (created: ${createdCount}, existing: ${existingCount}, skipped: ${skippedCount})`);
      }
    }

    console.log('\n========================================');
    console.log('🇮🇹 Italian locations seed completed!');
    console.log('========================================');
    console.log(`Regions:     ${regionsMap.size}`);
    console.log(`Provinces:   ${provincesMap.size}`);
    console.log(`Cities:      created=${createdCount}, existing=${existingCount}, skipped=${skippedCount}`);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Error seeding locations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
