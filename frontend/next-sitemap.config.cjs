/** next-sitemap.config.cjs **/
module.exports = {
  siteUrl: "https://kptattendance.vercel.app",
  generateRobotsTxt: true, // ✅ Automatically generate robots.txt
  sitemapSize: 7000, // optional, good for large sites
  exclude: [
    "/dashboard",
    "/admin",
    "/login",
    "/register",
    "/api/*",
    "/scan",
    "/settings",
    "/profile",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/admin",
          "/login",
          "/register",
          "/api/",
          "/scan",
          "/settings",
          "/profile",
        ],
      },
    ],
    additionalSitemaps: [
      "https://kptattendance.vercel.app/sitemap.xml",
    ],
  },
};
