const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const URI = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&authSource=admin";

async function main() {
  const client = new MongoClient(URI, { family: 4 });
  await client.connect();
  const db = client.db("rent_house_db");

  const users = await db.collection("users").find({}).toArray();

  for (const user of users) {
    // Bỏ qua user đã hash (bcrypt hash luôn bắt đầu bằng $2b$ hoặc $2a$)
    if (user.password?.startsWith("$2b$") || user.password?.startsWith("$2a$")) {
      console.log(`✅ ${user.username} — đã hash, bỏ qua`);
      continue;
    }

    // Hash password plaintext
    const hashed = await bcrypt.hash(user.password, 10);
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { password: hashed } }
    );
    console.log(`🔐 ${user.username} — đã hash password "${user.password}"`);
  }

  console.log("\n✅ Migration hoàn tất!");
  await client.close();
}

main().catch(console.error);