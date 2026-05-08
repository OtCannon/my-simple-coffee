import Dexie from 'dexie';

export const db = new Dexie('CoffeeSensoryDB');

// Define schema
db.version(4).stores({
  logs: '++id, store, bean_name, region, estate_farm, roast, process, date, overall, status',
  vendor_comments: '++id, bean_name, store, roast, process, vendor_comment, *flavor_tags, rating'
});

// Seed data or setup if needed
export async function initDB() {
  try {
    await db.open();
    console.log("Database initialized");
  } catch (err) {
    console.error("Failed to open db", err);
  }
}

// Utility to ensure ID is the correct type (Integer for ++id)
function parseId(id) {
  if (typeof id === 'string' && !isNaN(id)) {
    return parseInt(id, 10);
  }
  return id;
}

export async function addLog(logData) {
  // Default status to active
  if (!logData.status) {
    logData.status = 'active';
  }
  // If we have a top-level overall in schema, ensure it exists
  if (logData.ratings && logData.ratings.overall !== undefined) {
    logData.overall = logData.ratings.overall;
  }
  return await db.logs.add(logData);
}

export async function getAllLogs() {
  const logs = await db.logs
    .where('status').notEqual('deleted')
    .toArray();
  return logs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLogById(id) {
  return await db.logs.get(parseId(id));
}

export async function updateLog(id, updates) {
  // Ensure nested overall updates top-level index
  if (updates.ratings && updates.ratings.overall !== undefined) {
    updates.overall = updates.ratings.overall;
  }
  return await db.logs.update(parseId(id), updates);
}

export async function deleteLog(id) {
  // Soft delete
  return await db.logs.update(parseId(id), { status: 'deleted' });
}

export async function clearAllLogs() {
  return await db.logs.clear();
}

export async function resetDatabase() {
  await db.delete();
  window.location.reload();
}

export async function seedMockData() {
  const beans = ["Ethiopia Yirgacheffe", "Colombia Huila", "Brazil Cerrado", "Kenya AA", "Sumatra Mandheling", "Guatemala Antigua", "Costa Rica Tarrazu", "Panama Geisha", "Vietnam Robusta", "India Monsoon Malabar"];
  const stores = ["Artisan Roastery", "The Coffee Bean", "Morning Brew", "Daily Grind", "Peak Coffee", "Corner Cafe", "Cloud Nine", "Heritage Beans"];
  const regions = ["Africa", "South America", "Central America", "Asia", "Oceania"];
  const processes = ["Washed", "Natural", "Honey", "Anaerobic", "Semi-Washed"];
  const allFlavors = ["Floral", "Jasmine", "Rose", "Berry", "Strawberry", "Blueberry", "Citrus", "Lemon", "Orange", "Apple", "Peach", "Chocolate", "Dark Chocolate", "Caramel", "Honey", "Vanilla", "Nutty", "Almond", "Hazelnut", "Spices", "Cinnamon", "Winey", "Fermented"];

  const mockLogs = [];
  const now = new Date();

  for (let i = 0; i < 100; i++) {
    const randomDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const overall = Math.floor(Math.random() * 5) + 1;
    
    let roast = Math.floor(Math.random() * 5) + 1;
    let acid = Math.floor(Math.random() * 5) + 1;
    let sweet = Math.floor(Math.random() * 5) + 1;
    let bitter = Math.floor(Math.random() * 5) + 1;
    let body = Math.floor(Math.random() * 5) + 1;
    
    const logFlavors = [];
    const numFlavors = Math.floor(Math.random() * 3) + 1;
    for(let j=0; j<numFlavors; j++) {
      const f = allFlavors[Math.floor(Math.random() * allFlavors.length)];
      if(!logFlavors.includes(f)) logFlavors.push(f);
    }

    mockLogs.push({
      bean_name: beans[Math.floor(Math.random() * beans.length)] + " #" + (i + 1),
      store: stores[Math.floor(Math.random() * stores.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      estate_farm: "Farm " + String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      roast: roast,
      process: processes[Math.floor(Math.random() * processes.length)],
      date: randomDate.toISOString().split('T')[0],
      ratings: {
        acid: acid,
        sweet: sweet,
        bitter: bitter,
        body: body,
        overall: overall
      },
      overall: overall,
      flavor_tags: logFlavors,
      notes: "Auto-generated mock data for validation.",
      status: 'active'
    });
  }

  await db.logs.bulkAdd(mockLogs);
  return await seedVendorData();
}

export async function seedVendorData() {
  const beans = ["Specialty Geisha", "Limited Edition Sidamo", "Reserve Bourbon", "Rare Pacamara", "Micro-lot Caturra", "Grand Cru Arabica", "Black Diamond", "Golden Harvest", "Velvet Roast", "Midnight Blend"];
  const stores = ["Vendor Prime", "Global Roasters", "Epic Beans", "Elite Coffee Co", "Select Roast"];
  const comments = [
    "A symphony of floral notes with a lingering jasmine finish. Truly exceptional.",
    "Brimming with vibrant acidity and juicy berry sweetness. A morning delight.",
    "Rich and velvety with deep chocolate undertones and a hint of toasted hazelnut.",
    "Incredibly smooth body with a caramel-like sweetness that coats the palate.",
    "Bold and intense with spicy notes of cinnamon and a wine-like complexity.",
    "Refreshingly clean with citrus brightness and a delicate honey sweetness.",
    "Full-bodied and robust, featuring earthy notes and a subtle smoky finish.",
    "Complex and balanced, weaving together notes of stone fruit and vanilla.",
    "Exotic and punchy, with tropical fruit aromas and a bright, zesty acidity.",
    "Silky and sweet, reminiscent of ripe peaches and cream. A crowd favorite."
  ];
  const allFlavors = ["Floral", "Jasmine", "Berry", "Strawberry", "Citrus", "Lemon", "Chocolate", "Nutty", "Caramel", "Honey", "Vanilla", "Spices", "Winey", "Peach", "Stone Fruit"];

  const vendorData = [];
  for (let i = 0; i < 100; i++) {
    const roast = Math.floor(Math.random() * 5) + 1;
    const process = ["Washed", "Natural", "Honey", "Anaerobic"][Math.floor(Math.random() * 4)];
    const numFlavors = Math.floor(Math.random() * 3) + 2;
    const flavors = [];
    for(let j=0; j<numFlavors; j++) {
      const f = allFlavors[Math.floor(Math.random() * allFlavors.length)];
      if(!flavors.includes(f)) flavors.push(f);
    }

    vendorData.push({
      bean_name: beans[Math.floor(Math.random() * beans.length)] + " " + (100 + i),
      store: stores[Math.floor(Math.random() * stores.length)],
      roast: roast,
      process: process,
      vendor_comment: comments[Math.floor(Math.random() * comments.length)],
      flavor_tags: flavors,
      rating: (Math.random() * 2 + 3).toFixed(1)
    });
  }

  return await db.vendor_comments.bulkAdd(vendorData);
}

export async function getVendorRecommendations() {
  return await db.vendor_comments.toArray();
}

