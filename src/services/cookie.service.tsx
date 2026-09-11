// src/services/cookieService.ts
import Cookies from "js-cookie";
import { Country } from "@/shared/types/country";
import { Env } from "@/shared/types/env";
// import { Domain } from "@mui/icons-material";

// const COOKIE_EXPIRY_DAYS = 7; // Adjust as needed

const CookieService = {
  allowCookies() {
    Cookies.set("logged-in", "true", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
    });
    Cookies.set("allow-cookie", "true", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      // httpOnly: true,
      secure: true,
      sameSite: "None", // Required for cross-origin cookies
    });
  },

  setUsername: (username: string) => {
    Cookies.set("X-User-Name", username, {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      // httpOnly: true,
      secure: true,
      sameSite: "None", // Required for cross-origin cookies
    });
  },

  setEnv: (env: Env) => {
    Cookies.set("X-Env", JSON.stringify(env), {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      // httpOnly: true,
      secure: true,
      sameSite: "None", // Required for cross-origin cookies
    });
    // if (import.meta.env.VITE_LOCALHOST === 'true') {
    // localStorage.setItem("X-Env", JSON.stringify(env));
    // }
  },

  setUserType: (userType: string) => {
    Cookies.set("X-User-Type", userType, {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      // httpOnly: true,
      secure: true,
      sameSite: "None", // Required for cross-origin cookies
    });
  },

  setToken: (token: string) => {

    Cookies.set("nnp-token", token, {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
  },

  setRefreshToken: (token: string) => {
    Cookies.set("nnp-refresh-token", token, {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
  },

  setCountry: (country: any) => {
    Cookies.set("country-code", JSON.stringify(country), {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
  },

  getCountryCode: (): string | undefined => {
    const country = Cookies.get("country-code");
    const parsedCountry: Country = country ? JSON.parse(country) : undefined;
    return parsedCountry.countryCode;
  },

  getCountryCurrency: (): string | undefined => {
    const country = Cookies.get("country-code");
    const parsedCountry: Country = country ? JSON.parse(country) : undefined;
    return parsedCountry?.currency;
  },
  getLoggedIn: (): boolean => {
    return Cookies.get("logged-in") == "true" ? true : false;
  },

  getUsername: (): string | undefined => {
    return Cookies.get("X-User-Name");
  },

  getEnv: () => {
    const xEnv = Cookies.get("X-Env");
    return xEnv ? JSON.stringify(xEnv) : undefined;
  },


  getEnvId: (): string | undefined => {
    // const xEnv = localStorage.getItem("X-Env");
    // const xEnvParse = xEnv ? JSON.parse(xEnv) : undefined;
    const xEnv = Cookies.get("X-Env");
    const xEnvParse = xEnv ? JSON.parse(xEnv) : undefined;
    return xEnvParse?.envId || null;
  },

  getUserType: (): string | undefined => {
    return Cookies.get("X-User-Type");
  },

  getToken: () => {
    return Cookies.get("nnp-token");
  },

  getRefreshToken: () => {
    return Cookies.get("nnp-refresh-token");
  },
  clearCookies: () => {

    Cookies.remove("X-User-Name", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("X-Env", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("X-User-Type", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("nnp-token", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("logged-in", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("nnp-refresh-token", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
    Cookies.remove("country-code", {
      domain: import.meta.env.VITE_COOKIE_DOMAIN || "localhost",
      path: "/",
      secure: true,
      sameSite: "None",
    });
  },

  // setLocalstorageLoggedIn: (value: boolean) => {
  //   // if (import.meta.env.VITE_LOCALHOST === 'true') {
  //   localStorage.setItem("isLoggedIn", JSON.stringify(value));
  //   // }
  // },


  // clearLocalstorage: () => {
  //   localStorage.clear();
  // },

  // getLocalstorageLoggedIn: () => {
  //   return JSON.parse(localStorage.getItem("isLoggedIn") || "false");
  // }

};

export default CookieService;
