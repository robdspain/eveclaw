import HomeScreen from "./home-screen";

// Never statically prerender/cache this page. It's the gated app shell —
// a cached copy served straight from Netlify's CDN edge would bypass the
// auth middleware entirely (confirmed: x-nextjs-prerender + Netlify Durable
// cache hit skipped middleware on the unauthenticated check).
export const dynamic = "force-dynamic";

export default function Page() {
  return <HomeScreen />;
}
