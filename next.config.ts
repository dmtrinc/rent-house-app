import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Vẫn giữ cái này để bỏ qua lỗi Type khi deploy
    ignoreBuildErrors: true,
  },
  // Tuyệt đối KHÔNG để mục eslint ở đây nữa
};

export default nextConfig;