import type { ApiResponse } from "@/types/api";
import type { AuthResponse, LoginProps, RegisterProps } from "@/types/auth";
import api from "./api";

const baseURL = "https://be.dev.familytree.io.vn/api";

const authService = {
    register(props: RegisterProps): Promise<ApiResponse<AuthResponse>> {
        return api.post(baseURL + '/Account/register', { ...props });
    },

    login(props: LoginProps): Promise<ApiResponse<AuthResponse>> {
        return api.post(baseURL + '/Account/login', { ...props });
    },
};

export default authService;