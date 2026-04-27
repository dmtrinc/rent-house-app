"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Đăng ký thành công! Hãy đăng nhập.");
      window.location.href = "/login";
    } else {
      alert(data.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-24 text-black">
      <h1 className="text-2xl font-bold mb-4 text-white">Đăng ký tài khoản</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80">
        <input 
          className="border p-2 rounded" 
          type="text" 
          placeholder="Tên của bạn" 
          onChange={(e) => setFormData({...formData, name: e.target.value})} 
        />
        <input 
          className="border p-2 rounded" 
          type="email" 
          placeholder="Email" 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          className="border p-2 rounded" 
          type="password" 
          placeholder="Mật khẩu" 
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Đăng ký
        </button>
      </form>
    </div>
  );
}