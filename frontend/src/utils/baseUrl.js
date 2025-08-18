// utils/baseUrl.js
const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const BASE_URL = `${apiBase}/api/intor`;
export default BASE_URL;
