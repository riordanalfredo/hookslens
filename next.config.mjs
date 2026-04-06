/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/hookslens",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
