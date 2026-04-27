"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

    try {
      const res = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        // Làm mới trang để cập nhật danh sách ngay lập tức
        router.refresh();
      } else {
        const data = await res.json();
        alert("Lỗi: " + data.error);
      }
    } catch (error) {
      alert("Không thể kết nối đến máy chủ");
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        backgroundColor: "rgba(255, 0, 0, 0.8)",
        color: "white",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
      }}
    >
      ✕
    </button>
  );
}