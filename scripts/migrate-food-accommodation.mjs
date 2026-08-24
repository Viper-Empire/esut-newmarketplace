import mysql from "mysql2/promise";

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const expected = {
  5: { name: "Hostel & Lodge", slug: "hostel-home", nextName: "Accommodation", nextSlug: "accommodation" },
  6: { name: "Food & Groceries", slug: "food", nextName: "Food", nextSlug: "food" },
};

const [before] = await connection.query(
  `SELECT c.id, c.name, c.slug, c.parentId, c.isActive, c.sortOrder,
    (SELECT COUNT(*) FROM listings l WHERE l.categoryId = c.id) AS listingCount,
    (SELECT COUNT(*) FROM searchAlerts a WHERE a.categorySlug = c.slug) AS savedSearchCount
   FROM categories c WHERE c.id IN (5, 6) ORDER BY c.id`,
);
console.log(JSON.stringify({ phase: "before", rows: before }, null, 2));

if (before.length !== 2) throw new Error(`Expected exactly category ids 5 and 6, found ${before.length}`);
for (const row of before) {
  const rule = expected[row.id];
  if (!rule || row.name !== rule.name || row.slug !== rule.slug) {
    throw new Error(`Guard failed for category ${row.id}: expected ${rule?.name}/${rule?.slug}, found ${row.name}/${row.slug}`);
  }
}

await connection.beginTransaction();
try {
  await connection.query(
    `UPDATE categories SET name = ?, slug = ? WHERE id = ? AND name = ? AND slug = ?`,
    [expected[5].nextName, expected[5].nextSlug, 5, expected[5].name, expected[5].slug],
  );
  await connection.query(
    `UPDATE categories SET name = ?, slug = ? WHERE id = ? AND name = ? AND slug = ?`,
    [expected[6].nextName, expected[6].nextSlug, 6, expected[6].name, expected[6].slug],
  );
  await connection.query(`UPDATE searchAlerts SET categorySlug = ? WHERE categorySlug = ?`, [expected[5].nextSlug, expected[5].slug]);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}

const [after] = await connection.query(
  `SELECT c.id, c.name, c.slug, c.parentId, c.isActive, c.sortOrder,
    (SELECT COUNT(*) FROM listings l WHERE l.categoryId = c.id) AS listingCount,
    (SELECT COUNT(*) FROM searchAlerts a WHERE a.categorySlug = c.slug) AS savedSearchCount
   FROM categories c WHERE c.id IN (5, 6) ORDER BY c.id`,
);
console.log(JSON.stringify({ phase: "after", rows: after }, null, 2));
for (const row of after) {
  const rule = expected[row.id];
  if (row.name !== rule.nextName || row.slug !== rule.nextSlug) throw new Error(`Verification failed for category ${row.id}`);
}
await connection.end();
