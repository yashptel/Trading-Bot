import axios from "axios";

const http = axios.create({
  // baseURL: "http://127.0.0.1:3001",
  baseURL: "https://trade-proxy.vercel.app/v1/proxy",
});

http.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default http;
