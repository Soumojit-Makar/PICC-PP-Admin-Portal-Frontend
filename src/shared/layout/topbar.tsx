import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import Cookies from 'js-cookie';

import { useEffect, useState } from "react";
import logo from '../../assets/NNP_logo.png';
import { getXUser, handleLogout } from "../utils";
import Tooltip from "@mui/material/Tooltip";
import { IconButton } from "@mui/material";

// 1. Import your ThemeToggle component
import ThemeToggle from '@/widgets/themetoggle'; 

const TopBar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    
    const isUserLoggedIn = () => {
        return Cookies.get('X-Env') ? true : false;
    }

    useEffect(() => {
        console.log('isLoggedIn:', isLoggedIn);
    }, [isLoggedIn]);

    useEffect(() => {
        const loggedIn = isUserLoggedIn();
        setIsLoggedIn(loggedIn);
    }, []);

    return (
        <div className="top-header bg-[#1a1a1a] dark:bg-black text-white flex items-center justify-between" style={{ padding: "0 var(--nnp-padding-small)" }}>
            <div className="h-full flex items-center">
                <img src={logo} className="h-[inherit]" style={{ paddingRight: "var(--nnp-padding-small)" }} />
                <span className="font-bold text-white ml-2">ADMINISTRATION</span>
            </div>
            
            <div className="flex items-center text-white">
                {/* Theme toggle icon */}
                <ThemeToggle />
                
                <span className="mx-2 opacity-30 text-white">|</span>

                <span className="flex items-center text-white">
                    <PersonIcon sx={{ fontSize: "var(--font-size-lg)" }} />
                    <span className="ml-1 lowercase text-xs tracking-wider">{getXUser()}</span>
                </span>
                
                <span className="mx-2 opacity-30 text-white">|</span>
                
                <Tooltip title="Logout" arrow>
                    <IconButton sx={{
                        padding: 0,
                        color: "white", 
                        "&:hover": {
                            color: "#ccc", 
                            backgroundColor: "transparent" 
                        }
                    }} onClick={() => handleLogout()}>
                        <LogoutIcon sx={{ fontSize: "var(--font-size-lg)" }} />
                    </IconButton>
                </Tooltip>
            </div>
        </div>
    );
};

export default TopBar;