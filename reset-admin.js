const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const URI = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&authSource=admin";

async function main() {
  const client = new MongoClient(URI, { family: 4 });
  await client.connect();
  const db = client.db("rent_house_db");
  const hashed = await bcrypt.hash("poiuytre", 10);
  await db.collection("users").updateOne(
    { username: "admintri" },
    { $set: { password: hashed } }
  );
  console.log("Done — mật khẩu mới: poiuytre");
  await client.close();
}

main().catch(console.error);