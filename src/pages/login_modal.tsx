import AuthAPI from "@/services/auth.service";
import CookieService from "@/services/cookie.service";
import { LoginForm } from "@/shared/config/input.cofig";
import { Env, LoginCred } from "@/shared/types/env";
import { InputConfig } from "@/shared/types/inputconfig";
import { LoginModel } from "@/shared/types/login";
import { showConfirmDialog } from "@/widgets/confirmDialog";
import DynamicForm from "@/widgets/dynamicForm";
import Modal from "@/widgets/modal";
import { useEffect, useState } from "react";

const LoginModal = ({
    open,
    onClose,
    // onRegisterOpen,
}: {
    open: boolean;
    onClose: () => void;
    // onRegisterOpen: () => void;
}) => {
    const LoginFormCongif: InputConfig = LoginForm
    const [isModalOpen, setIsModalOpen] = useState(open);

    const getAccDetailsWithCountry = async () => {
        const res = await AuthAPI.getAccDetailsWithCountry(CookieService.getEnvId() || "");
        if (res && res.length) {
            const acc = res[0];
            const country = acc.nnpCountry;
            CookieService.setCountry(country || "US");
        }
    };
    const handleLogin = async (credentials: LoginModel) => {
        // if (formFields[0]?.values && formFields[1]?.values && formFields[2]?.values) {
        const env: Env | any = { envId: credentials.envId, envTenantId: 'devops' };
        const credential: LoginCred = {
            username: credentials.username,
            password: credentials.password,
            envId: credentials.envId,
            env: env,
        };
        try {
            const response = await AuthAPI.login(credential);
            if (response) {
                const responseData = await response.json();
                CookieService.allowCookies();
                CookieService.setToken(response.headers.get("nnp-token"));
                CookieService.setRefreshToken(response.headers.get("nnp-refresh-token"));
                CookieService.setUsername(credentials.username);
                CookieService.setEnv(env);
                CookieService.setUserType(responseData.userType);
                // CookieService.setLocalstorageLoggedIn(true);
                // window.dispatchEvent(new Event("storage"));
                onClose();
                getAccDetailsWithCountry();
                setTimeout(() => window.location.reload(), 100);
            }
        } catch (error) {
            showConfirmDialog({
                type: "error",
                message: "Login failed. Please check your credentials.",
                confirmText: "OK",
            });
        }
    };
    useEffect(() => {
        setIsModalOpen(open);
    }, [open]);

    return <>
        <Modal
            isOpen={isModalOpen}
            onClose={() => location.reload()}
            title="Login"
        >
            <DynamicForm inputs={LoginFormCongif ?? []} layout="single" onSubmit={handleLogin} defaultValues={new LoginModel()} />
        </Modal>
    </>;
};

export default LoginModal;
