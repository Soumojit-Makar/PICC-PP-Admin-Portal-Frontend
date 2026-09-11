import React, { useEffect, useState } from 'react'
import TopBar from './topbar'
import NavBar from './navbar'
import LoginModal from '@/pages/login_modal'
import CookieService from '@/services/cookie.service'
import AuthAPI from '@/services/auth.service'
interface Props {
    children: React.ReactNode
}

const HeaderLayout: React.FC<Props> = ({ children }) => {

    const [isLoginModalOpen, setLoginModalOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(CookieService.getLoggedIn());
    
    useEffect(() => {
        const userType = CookieService.getUserType()
        if (userType && userType == 'superAdmin') {
            setIsLoggedIn(true);
            return;
        } else {
            setIsLoggedIn(false);
            AuthAPI.logout()
        }
    }, []);

    useEffect(() => {
        if (!isLoggedIn) {
            setLoginModalOpen(true);
        }
    }, [isLoggedIn]);
    
    return (
        <div className='nnp-layout-container text-gray-900 dark:text-gray-100'>
            <TopBar />
            <NavBar />
            <div className='nnp-main-container overflow-y-auto h-[500px] p-0'>
                <div className='nnp-main-content page-padding-large '>
                    {children}
                </div>
            </div>
            <LoginModal
                open={isLoginModalOpen}
                onClose={() => { setLoginModalOpen(false) }}
            />
        </div>
    )
}

export default HeaderLayout