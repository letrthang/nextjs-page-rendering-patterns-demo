This is a comprehensive [Next.js](https://nextjs.org) demonstration project designed to explore modern web rendering strategies and performance monitoring. It integrates with [Directus](https://directus.io) as a headless CMS to provide real-world data fetching scenarios.

### 🚀 Core Objectives: Rendering Patterns & Memory Profiling

The primary goal of this project is to visualize and compare the lifecycle of different Next.js rendering patterns. It provides hands-on examples to understand:

- **SSG (Static Site Generation):** Pre-rendering pages at build time for maximum speed and SEO.
- **ISR (Incremental Static Regeneration):** Updating static content after deployment without a full rebuild.
- **SSR (Server-Side Rendering):** Generating HTML on-demand for each request to ensure data is always fresh.
- **CSR (Client-Side Rendering):** Handling data fetching and UI updates directly in the browser.

Beyond rendering, this project includes a detailed guide on **Memory Profiling**, allowing developers to track heap allocations and identify potential memory leaks in a Node.js environment.

## Getting Started

To demo rendering patterns, we need to build and run on production mode.

### 1. Setup Web app ENV variable and update DB file for directus

- Update file **.env** with the token you created on Directus CMS.
- Using this DB file: [Directus DB docker](https://github.com/letrthang/nextjs-page-rendering-patterns-demo/blob/main/database/data.db) for your Directus docker. See docker-compose.yml to know how it is mapping.

### 2. Install packages

`pnpm install`

### 3. Build and Run on production mode (we build with standalone mode)

`pnpm build && pnpm start`

Or

`node .next/standalone/server.js`

### 4. Start Directus CMS docker and Access web app and CMS

- Open CMS at: [http://localhost:8055](http://localhost:8055)

- Open web app at: [http://localhost:3000](http://localhost:3000)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.


## Architecture and Deployment

### Architecture - https://directus.io vs Next.js
![Alt text](./doc/architecture.png)


### Deployment 

- You should set up Directus on docker (docker-compose.yml) and copy file */database/data.db* to replace your data.db file and run Next.js app on **dev** mode with ` pnpm run dev`. For **prod** mode, see above section.

You could see the home page as below:


![Alt text](./doc/demo.png)

### Rendering Patterns Matrix

![Alt text](./doc/rendering_patterns_matrix.png)

### SSG - Static Site Generation

**Source:** `src/app/ssg_page/[id]/page.tsx`

**Method:** Uses `generateStaticParams` to pre-render pages at build time

**Pre-rendered pages are stored at:**
- `.next/server/app/ssg_page/` (standard build - used by `pnpm start`)
- `.next/standalone/.next/server/app/ssg_page/` (standalone build - used by `node .next/standalone/server.js`)

**Generated files per page:**
- `{id}.html` - Pre-rendered HTML content
- `{id}.rsc` - React Server Component payload
- `{id}.meta` - Metadata and configuration
- `{id}.segments/` - Code splitting segments

**Data fetching:** Direct call to Directus API at build time (server-side only)

#### Understanding Next.js Static Chunks and CDN Caching

**Static chunks location:**
```
.next/static/chunks/
├── ff1a16fafef87110.js  ← Code-split JavaScript bundle
├── a6dad97d9634a72d.js  ← Shared libraries chunk
└── ...
```

**How chunks are loaded:**

![Alt text](./doc/static_hash_chunk.png)
![Alt text](./doc/static_hash_chunk_data.png)

1. HTML/RSC files reference chunks: `<script src="/_next/static/chunks/ff1a16fafef87110.js"></script>`
2. Browser downloads chunks from `.next/static/chunks/`
3. Hash-based filename (e.g., `ff1a16fafef87110`) = content fingerprint
   - Same code → same hash → effective caching
   - Changed code → new hash → new filename

**CDN caching strategy:**
- Static chunks use: `Cache-Control: public, max-age=31536000, immutable`
- Cached for 1 year with no revalidation (hash changes = new file)

**Common deployment issue: Missing old hash files**

**Problem:**
```
Deployment 1: .next/static/chunks/abc123.js (user's browser cached this)
Deployment 2: .next/static/chunks/xyz789.js (new build DELETES abc123.js)
Result: User gets 404 error trying to load abc123.js ❌
```

**Solutions:**

#### Solution 1: Clear ALL CDN cache after deployment (Simplest for ephemeral pods)

**When to use:** Kubernetes/Docker deployments with ephemeral storage and CDN (CloudFront, Cloudflare, etc.)

**Why this works:**
- After deployment, new pod only has new chunks (xyz789.js)
- Old chunks (abc123.js) are gone from pod
- Clearing ALL CDN cache forces fresh fetch of both HTML and chunks
- No mismatch between cached HTML and available chunks

**Implementation:**
```bash
# GitLab CI/CD pipeline (.gitlab-ci.yml)
after_deploy:
  - |
    # Clear entire CloudFront/CDN cache
    aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_ID \
      --paths "/*"

    # OR for Cloudflare
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
      -H "Authorization: Bearer $CF_TOKEN" \
      -d '{"purge_everything":true}'
```

**Trade-offs:**
- ✅ Simple, no infrastructure changes needed
- ✅ Guarantees no 404 errors from mismatched chunks
- ✅ Works with ephemeral pod storage
- ⚠️ First request after deployment is slower (cache miss)
- ⚠️ Temporarily higher load on origin pods

**Cache strategy with this approach:**
```typescript
// next.config.ts - Keep your desired cache times
async headers() {
  return [
    {
      source: '/:path*',
      headers: [{
        key: 'Cache-Control',
        value: 's-maxage=1800, stale-while-revalidate=600', // 30min cache
      }],
    },
    {
      source: '/_next/static/:path*',
      headers: [{
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable', // 1 year cache
      }],
    },
  ];
}
```

---

#### Solution 2: Don't invalidate static chunks (Recommended for persistent storage)

**When to use:** When you can preserve old static files across deployments

**Why this works:**
- Static chunks use hash-based filenames (abc123.js vs xyz789.js)
- New deployment = new hash = new filename
- Old chunks can stay cached forever because new HTML references new chunks
- Only invalidate HTML/pages, not `/_next/static/*`

**Implementation:**
```bash
# GitLab CI/CD - Only invalidate HTML, NOT static assets
after_deploy:
  - |
    aws cloudfront create-invalidation \
      --distribution-id $CLOUDFRONT_ID \
      --paths "/" "/page/*" "/ssg_page/*" "/isr_page/*" "/ssr_page/*"
    # Do NOT include "/_next/static/*"
```

**Requires:** Persistent storage for static files (S3, persistent volumes, or merged deployments)

**Key insight:** Static chunks use immutable caching. Once cached with hash `abc123.js`, browsers expect it to exist forever. When using ephemeral pod storage, clear all CDN cache after deployment to prevent 404 errors.

## Memory Profiling

### **Step 1: Start app**
- Run web app in local machine with command: ` $env:NODE_OPTIONS="--inspect=0"; npm run dev` OR with prod: `$env:NODE_OPTIONS="--inspect=0"; npm start`

![Alt text](./doc/profiling_1.png)


### **Step 2: Open Inspect tool**
1. Open **Chrome** browser (or Edge)
2. In the address bar, type: `chrome://inspect`
3. Press Enter

You should see a page titled **"Devices"**

![Alt text](./doc/profiling_2.png)


### **Step 3: Configure the Port (if needed)**

1. Click the **"Configure..."** button (near the top)
2. Make sure inspection listener port are in the list:
```
   localhost:9229
   localhost:9230
```
3. If the port is missing, add it
4. Click **"Done"**

![Alt text](./doc/profiling_3.png)

Under **"Remote Target"** section, you should see:
```
Remote Target #LOCALHOST
  Target (v20.14.0)
  file:///.../directus-app/node_modules/next/dist/bin/next
  inspect
```
Click the **"inspect"** link under your Next.js process.

## 📊 **Step 4: Take Allocation Profile**

A new DevTools window will open. Now:

### **Allocation Instrumentation Timeline (Best for Finding Leaks)**

1. Click the **"Memory"** tab (at the top)
2. Select the radio button: **"Allocation instrumentation on timeline"**
3. Click the blue **"Start"** button at the bottom

Now the profiler is recording!

![Alt text](./doc/profiling_4.png)

4. **Use your app** - Open another browser tab and move around the page:
`http://localhost:3000`

## 📊 **Step 5: Stop recording and Review results**

Wait for profiling completed and view report

![Alt text](./doc/profiling_5.png)


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!