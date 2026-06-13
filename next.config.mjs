/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Tree-shake large barrel packages so only the icons/animations actually
  // used ship to the client, shrinking the JS bundle.
  experimental: {
    optimizePackageImports: ["react-icons", "motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/linkedin", destination: "https://linkedin.com/in/AlzyWelzy", permanent: true },
      { source: "/github", destination: "https://github.com/AlzyWelzy", permanent: true },
      { source: "/twitter", destination: "https://twitter.com/AlzyWelzy", permanent: true },
      { source: "/instagram", destination: "https://www.instagram.com/alzywelzyy/", permanent: true },
      { source: "/facebook", destination: "https://www.facebook.com/AlzyWelzyy", permanent: true },
      { source: "/esyconnect", destination: "https://esyconnect.com/candidate/alzywelzy/", permanent: true },
    ];
  },
  async headers() {
    const securityHeaders = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
