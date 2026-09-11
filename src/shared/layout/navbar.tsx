import React, { useEffect, useState } from 'react'
import type { NavItemType } from '../types/nav'
import NavItem from './navItem'
import { useLocation } from 'react-router-dom';
import { IoClose, IoMenu } from 'react-icons/io5';

const menu: NavItemType[] = [
    {
        label: 'REGISTRATION REQUEST',
        baseroute: 'reg-request',
    },
    {
        label: 'ENVIRONMENT MANAGEMENT',
        baseroute: 'env',
    },
    {
        label: 'VM MANAGEMENT',
        baseroute: 'dms',
    },
    {
        label: 'USER ACCESS',
        baseroute: 'user-access',
    },
    {
        label: 'CONFIGURATON MANAGEMENT',
        baseroute: 'config',
    },
    {
        label: 'PLANS',
        baseroute: 'plan',
    },
    {
        label: 'COMPONENTS',
        baseroute: 'component',
    },
    {
        label: 'BILLING MANAGEMENT',
        baseroute: 'billing',
    },
    {
        label: 'SUPPORT',
        baseroute: 'support',
    },
]

const NavBar: React.FC = () => {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);
    const [isOpen, setIsOpen] = useState<any>(null)

    useEffect(() => {
        console.log(segments)
    }, [segments])

    return (
        <nav className="top-header flex w-full px-2 h-[var(--component-height-medium)] bg-white dark:bg-[#303030] border-b dark:border-gray-800 relative">
            
            {/* Desktop Menu */}
            <ul className="hidden md:flex justify-end h-full w-full">
                {menu.map((item, i) => (
                    <NavItem
                        key={i}
                        item={item}
                        selected={item.baseroute === segments[0]}
                        subpath={segments[1]}
                    />
                ))}
            </ul>

            {/* Mobile Hamburger */}
            <button
                className="md:hidden nnp-btn nnp-btn-primary text-[var(--text-color-secondary)] dark:text-gray-300 hover:text-primary transition-colors"
                onClick={() => setIsOpen((prev: any) => !prev)}
            >
                {isOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
            </button>

            {/* Mobile Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full submenu-container bg-white dark:bg-[#1e1e1e] shadow-md md:hidden border-t dark:border-gray-800 z-50">
                    <ul className="flex flex-col divide-y dark:divide-gray-800">
                        {menu.map((item, i) => (
                            <NavItem
                                key={i}
                                item={item}
                                selected={item.baseroute === segments[0]}
                                subpath={segments[1]}
                                mobile
                                onClick={() => setIsOpen(false)}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </nav>
    )
}

export default NavBar