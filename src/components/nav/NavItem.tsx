import React from 'react';

interface NavItemProps {
    text: string;
    active?: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ text, active, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`rounded-md w-10 h-10 p-1 mx-2 my-0.5 font-medium transition-all cursor-pointer border-none focus:outline-0 focus-visible:outline-0 ${active ? 'ring-1 ring-gray-300 bg-gray-200 dark:ring-gray-600 dark:bg-gray-700' : 'text-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'}`}
            aria-current={active ? 'page' : undefined}
        >
            {text}
        </button>

    );
};

export default NavItem;