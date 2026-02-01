import type {NextConfig} from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, s-maxage=60, stale-while-revalidate=120',
                    },
                ],
            },
            {
                source: '/_next/static/:path*',
                headers: [{
                    key: 'Cache-Control',
                    value: 'public, max-age=31536000, immutable', // 1 year cache
                }],
            }
        ];
    },
};

export default nextConfig;
