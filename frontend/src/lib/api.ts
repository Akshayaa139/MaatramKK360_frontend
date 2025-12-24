import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";

const baseRaw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const base = baseRaw.replace(/\/+$/, "");
const baseURL = /\/api$/.test(base) ? base : `${base}/api`;

const api = axios.create({ baseURL });

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
        // config.headers may be AxiosHeaders; cast to any before assigning plain object
        config.headers = {
          ...((config.headers as any) || {}),
          Authorization: `Bearer ${token}`,
        } as any;
      }
    }
  }
  return config;
});

export default api;
