import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Resolve imports ESM com extensão .js apontando para arquivos .ts (NodeNext-style),
  // que tsx/tsc já aceitam. Sem isto, o webpack do Next não acha '@/lib/x.js' → x.ts.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    }
    return config
  },
}

export default nextConfig
