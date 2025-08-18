import axios from "axios";

const axiosToken = axios.create({});

axiosToken.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `${token}`;
  }
  return config;
});

export default axiosToken;
