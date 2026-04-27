const { MongoClient } = require('mongodb');

// Dùng chuỗi rút gọn nhất có thể
const uri = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&authSource=admin";

async function runTest() {
    console.log("⏳ Đang thử kết nối cưỡng chế IPv4...");
    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
        family: 4 // Ép dùng IPv4
    });

    try {
        await client.connect();
        console.log("✅ KẾT NỐI THÀNH CÔNG!");
    } catch (error) {
        console.error("❌ Vẫn thất bại!");
        console.error("Lỗi:", error.message);
    } finally {
        await client.close();
        process.exit();
    }
}
runTest();