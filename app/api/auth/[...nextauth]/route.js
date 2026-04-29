import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcrypt";

// QUAN TRỌNG: Phải có chữ 'export' ở đây
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials?.email });
        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          return { id: user._id, name: user.name, email: user.email, role: user.role };
        }
        return null;
      }
    })
  ],
  // ... các cấu hình khác (callbacks, session, secret)
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

