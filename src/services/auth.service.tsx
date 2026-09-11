import CookieService from "./cookie.service";
import ApiService from "./api.service";
import { LoginModel } from "@/shared/types/login";

const BASE_URL = import.meta.env.VITE_AUTH as string;
const DASH_URL = import.meta.env.VITE_DASH as string;

export const AuthAPI = {

    login: (credentials: LoginModel) => ApiService.raw_post(`${BASE_URL}/loginNnp`, credentials),
    logout: () => {
        const credentials = {
            accessToken: CookieService.getToken(),
            refreshToken: CookieService.getRefreshToken()
        }
        return ApiService.post(`${BASE_URL}/logout`, credentials)
    },
    getAccDetailsWithCountry: (envId: string) => ApiService.get(`${DASH_URL}/account/${envId}`),
};

export default AuthAPI;
