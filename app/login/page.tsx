"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/", 
      });
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-24 text-black">
      <h1 className="text-2xl font-bold mb-4 text-white">Đăng nhập</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4 w-80">
        <input 
          className="border p-2 rounded bg-white" 
          type="email" 
          placeholder="Email" 
          required
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          className="border p-2 rounded bg-white" 
          type="password" 
          placeholder="Mật khẩu" 
          required
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600 transition">
          Vào hệ thống
        </button>
      </form>
    </div>
  );
}