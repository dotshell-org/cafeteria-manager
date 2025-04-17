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
        { text: "⏳", tab: Tab.History},
        { text: "📊", tab: Tab.Stats},
        { text: "💾", tab: Tab.Export},
        { text: "⚙️", tab: Tab.Settings },
    ];

    const handleTabSelected = (tab: Tab) => {
        onTabSelected(tab);
    }

    return (
        <div className="z-50 w-14 h-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600">
            <img src={Icon} alt="" className="p-1.5 mt-6 mb-4 dark:invert" />
            {items.map((item) => (
                <NavItem key={item.tab} text={item.text} active={selectedTab == item.tab} onClick={() => handleTabSelected(item.tab)} />
            ))}
        </div>
    )
}

export default NavBar