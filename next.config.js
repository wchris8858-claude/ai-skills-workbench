/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 在生产构建中忽略 ESLint 警告（预先存在的代码问题）
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      // 只允许常见的图片CDN和可信域名
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.pixabay.com',
      },
      {
        protocol: 'https',
        hostname: 'api4.mygptlife.com',
      },
      {
        protocol: 'https',
        hostname: 'api.siliconflow.cn',
      },
      // 如需添加其他域名,请在此处明确列出
      // 禁止使用通配符 '**' - SSRF 安全风险
    ],
  },
}

module.exports = nextConfig