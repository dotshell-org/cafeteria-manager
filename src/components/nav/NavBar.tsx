import Icon from '/app-icon.svg';
import NavItem from "./NavItem.tsx";
import {Tab} from '../../types/nav/Tab.ts'
import React from "react";

interface NavBarProps {
    selectedTab: Tab;
    onTabSelected: (tab: Tab) => void;
}

const NavBar: React.FC<NavBarProps> = ({ selectedTab, onTabSelected }) => {

    const items: { text: string, tab: Tab }[] = [
        { text: "📅", tab: Tab.Calendar },
        { text: "📝", tab: Tab.Objects},
        { text: "📊", tab: Tab.Stats},
        { text: "💾", tab: Tab.Export},
        { text: "⚙️", tab: Tab.Settings },
    ];

    const handleTabSelected = (tab: Tab) => {
        onTabSelected(tab);
    }

    return (
        <div className="z-10 w-14 h-full shadow-sm bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <img src={Icon} alt="" className="p-1.5 mt-6 mb-4" />
            {items.map((item) => (
                <NavItem text={item.text} active={selectedTab == item.tab} onClick={() => handleTabSelected(item.tab)} />
            ))}
        </div>
    )
}

export default NavBar