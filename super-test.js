const { MongoClient } = require('mongodb');

// Chuỗi kết nối chuẩn (Cluster)
const clusterUri = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017,ac-ydatyqd-shard-00-01.spr71mm.mongodb.net:27017,ac-ydatyqd-shard-00-02.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&replicaSet=atlas-w6zwz6-shard-0&authSource=admin";

// Chuỗi kết nối trực tiếp (Direct Connection - Bỏ qua việc tìm Primary)
const directUri = "mongodb://admin:abc123456@ac-ydatyqd-shard-00-00.spr71mm.mongodb.net:27017/rent_house_db?ssl=true&authSource=admin&directConnection=true";

async function runTests() {
    console.log("🔍 ĐANG KIỂM TRA CẤP ĐỘ 1: KẾT NỐI CỤM (CLUSTER)");
    const clusterClient = new MongoClient(clusterUri, { family: 4, serverSelectionTimeoutMS: 5000 });
    
    try {
        await clusterClient.connect();
        console.log("✅ Cấp độ 1: Thành công! Cụm Cluster hoạt động bình thường.");
    } catch (e) {
        console.log("❌ Cấp độ 1: Thất bại. Không tìm thấy Primary.");
        console.log("---");
        
        console.log("🔍 ĐANG KIỂM TRA CẤP ĐỘ 2: KẾT NỐI TRỰC TIẾP (DIRECT)");
        const directClient = new MongoClient(directUri, { family: 4, serverSelectionTimeoutMS: 5000 });
        try {
            await directClient.connect();
            console.log("✅ Cấp độ 2: Thành công! Kết nối trực tiếp tới Shard 00-00 ổn định.");
            console.log("👉 KẾT LUẬN: Mạng của bạn chặn giao thức quét Replica Set của MongoDB.");
        } catch (err) {
            console.log("❌ Cấp độ 2: Vẫn thất bại. Lỗi SSL hoặc Tường lửa chặn cổng.");
        } finally {
            await directClient.close();
        }
    } finally {
        await clusterClient.close();
    }
}

runTests();