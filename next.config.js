/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Autoriser les images externes si besoin (avatars Supabase Storage, etc.)
    remotePatterns: [],
  },
}

module.exports = nextConfig
