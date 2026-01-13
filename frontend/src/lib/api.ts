import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

const baseRaw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const base = baseRaw.replace(/\/+$/, "");
const baseURL = /\/api$/.test(base) ? base : `${base}/api`;

const api = axios.create({ baseURL });

export const BACKEND_URL = base;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headersObj = config.headers as unknown as
    | ({ get?: (name: string) => string | undefined } & Record<string, unknown>)
    | undefined;
  const existingAuth =
    headersObj &&
    (typeof headersObj.get === "function"
      ? headersObj.get("Authorization")
      : (headersObj["Authorization"] as string | undefined) ||
        (headersObj["authorization"] as string | undefined));
  if (!existingAuth) {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (token) {
      const h = config.headers as AxiosRequestConfig["headers"];
      const maybe = h as unknown as
        | { set?: (name: string, value: string) => void }
        | undefined;
      if (maybe && typeof maybe.set === "function") {
        maybe.set("Authorization", `Bearer ${token}`);
      } else {
        // config.headers may be AxiosHeaders
        if (config.headers) {
          config.headers["Authorization"] = `Bearer ${token}`;
        } else {
          config.headers = {
            Authorization: `Bearer ${token}`,
          } as unknown as InternalAxiosRequestConfig["headers"];
        }
      }
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        // Only redirect if we have a token that is now invalid
        // to avoid loops if the user is already on login page or public page
        const token = sessionStorage.getItem("token");
        if (token) {
          console.warn("Session expired, clearing storage and redirecting");
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("kk_user");
          window.dispatchEvent(new Event("session-expired"));
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
