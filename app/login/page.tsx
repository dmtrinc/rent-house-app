"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, action: isLogin ? "login" : "register" }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } else {
      setError(data.error);
    }
  };

  return (
    <main style={{ backgroundColor: "#000", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
      <div style={{ background: "#111", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "380px", border: "1px solid #222" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>{isLogin ? "Đăng Nhập" : "Tạo Tài Khoản"}</h2>
        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <input placeholder="Tên đăng nhập" style={inputStyle} onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="password" placeholder="Mật khẩu" style={inputStyle} onChange={e => setForm({...form, password: e.target.value})} required />
          {error && <p style={{ color: "#ff4d4d", fontSize: "12px", textAlign: "center" }}>{error}</p>}
          <button type="submit" style={buttonStyle}>{isLogin ? "Đăng Nhập" : "Đăng Ký ngay"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#888" }}>
          {isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: "#0070f3", cursor: "pointer", fontWeight: "bold" }}>{isLogin ? "Đăng ký" : "Đăng nhập"}</span>
        </p>
        <Link href="/" style={{ display: "block", textAlign: "center", marginTop: "15px", color: "#555", fontSize: "12px", textDecoration: "none" }}>Quay lại trang chủ</Link>
      </div>
    </main>
  );
}

const inputStyle = { padding: "14px", background: "#1a1a1a", border: "1px solid #333", color: "#fff", borderRadius: "10px", outline: "none" };
const buttonStyle = { padding: "14px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold" as const, cursor: "pointer", marginTop: "10px" };