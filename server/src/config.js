export const config = {
  PORT: process.env.PORT || 8080,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/p2pshare",
  JWT_SECRET: process.env.JWT_SECRET || "devsecret-change-me",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
};