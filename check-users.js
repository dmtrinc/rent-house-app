const { MongoClient } = require("mongodb");

const URI = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&authSource=admin";

async function main() {
  const client = new MongoClient(URI, { family: 4 });
  await client.connect();
  const db = client.db("rent_house_db");
  
  const users = await db.collection("users").find({}).toArray();
  
  users.forEach(u => {
    console.log({
      _id: u._id,
      username: u.username,
      password: u.password,
      role: u.role
    });
  });

  await client.close();
}

main().catch(console.error);