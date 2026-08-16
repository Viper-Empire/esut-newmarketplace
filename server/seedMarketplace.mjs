import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to seed the marketplace.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const categories = [
  ["Electronics", "electronics", "Smart devices and accessories", "⌁"], ["Fashion", "fashion", "Campus style and essentials", "✦"],
  ["Phones & Accessories", "phones", "Phones, chargers and more", "◉"], ["Books", "books", "Textbooks and study materials", "▤"],
  ["Hostel & Lodge", "hostel-home", "Everything for your space", "⌂"], ["Food & Groceries", "food", "Everyday food and groceries", "◒"],
  ["Services", "services", "Campus services and skills", "⌘"], ["Computing", "computing", "Laptops and computing", "⌗"],
];
for (const [index, category] of categories.entries()) await connection.execute("INSERT IGNORE INTO categories (name, slug, description, icon, isFeatured, isActive, sortOrder) VALUES (?, ?, ?, ?, 1, 1, ?)", [...category, index]);
const sellers = [["seed-tech", "ESUT Tech Hub", "esut-tech-hub", "Reliable campus devices, computer accessories and study tech.", "ESUT Main Campus"], ["seed-living", "Campus Living", "campus-living", "Student essentials for a more comfortable hostel life.", "Agbani Road, Enugu"], ["seed-books", "Study Corner", "study-corner", "Curated academic books and study supplies for ESUT students.", "ESUT Main Campus"]];
for (const [openId, name, slug, description, location] of sellers) {
  await connection.execute("INSERT IGNORE INTO users (openId, name, role, isActive, lastSignedIn) VALUES (?, ?, 'SELLER', 1, NOW())", [openId, name]);
  const [[user]] = await connection.execute("SELECT id FROM users WHERE openId = ?", [openId]);
  await connection.execute("INSERT IGNORE INTO stores (ownerUserId, name, slug, description, location, status, isVerified) VALUES (?, ?, ?, ?, ?, 'ACTIVE', 1)", [user.id, name, slug, description, location]);
}
const products = [
  ["esut-tech-hub", "electronics", "Wireless Study Headphones", "wireless-study-headphones", "Comfortable wireless headphones for focused study sessions, calls and everyday music.", "NEW", 1850000, 2200000, "ESUT Main Campus", 8],
  ["esut-tech-hub", "phones", "Portable Power Bank 20000mAh", "portable-power-bank-20000mah", "High-capacity power bank designed for long lecture days and busy schedules.", "NEW", 1650000, null, "ESUT Main Campus", 14],
  ["study-corner", "books", "Engineering Mathematics Textbook", "engineering-mathematics-textbook", "Well-kept engineering mathematics textbook for first and second-year courses.", "USED_GOOD", 750000, 900000, "ESUT Main Campus", 5],
  ["campus-living", "hostel-home", "Adjustable Study Lamp", "adjustable-study-lamp", "Compact adjustable LED desk lamp for reading, assignments and hostel desks.", "NEW", 1200000, null, "Agbani Road, Enugu", 11],
  ["campus-living", "fashion", "Classic Campus Backpack", "classic-campus-backpack", "A durable everyday backpack with laptop sleeve and organised compartments.", "NEW", 1450000, 1800000, "ESUT Main Campus", 9],
  ["study-corner", "computing", "Scientific Calculator", "scientific-calculator", "Reliable scientific calculator suitable for classes, laboratories and exams.", "NEW", 980000, null, "ESUT Main Campus", 16],
];
for (const [storeSlug, categorySlug, title, slug, description, condition, price, compareAt, location, quantity] of products) {
  const [[store]] = await connection.execute("SELECT id FROM stores WHERE slug = ?", [storeSlug]); const [[category]] = await connection.execute("SELECT id FROM categories WHERE slug = ?", [categorySlug]);
  await connection.execute("INSERT IGNORE INTO listings (storeId, categoryId, title, slug, description, `condition`, priceKobo, compareAtPriceKobo, location, fulfillmentDetails, status, allowOffers, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Campus pickup available at an agreed ESUT location.', 'ACTIVE', 1, NOW())", [store.id, category.id, title, slug, description, condition, price, compareAt, location]);
  const [[listing]] = await connection.execute("SELECT id FROM listings WHERE slug = ?", [slug]); await connection.execute("INSERT IGNORE INTO inventory (listingId, quantity, reservedQuantity) VALUES (?, ?, 0)", [listing.id, quantity]);
}
await connection.end();
console.log("ESUT Marketplace development seed completed.");
