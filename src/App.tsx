import {useMemo, useState, useEffect} from 'react';
import {useMediaQuery, createTheme, ThemeProvider} from '@mui/material';
import Calendar from "./pages/Calendar.tsx";
import NavBar from "./components/nav/NavBar.tsx";
import {Tab} from "./types/nav/Tab.ts";
import CashRegister from "./pages/CashRegister.tsx";
import dayjs from "dayjs";
import {AnimatePresence} from 'framer-motion';
import EditProducts from "./pages/EditProducts.tsx";
import History from "./pages/History.tsx";

function App() {

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode: prefersDarkMode ? 'dark' : 'light',
                text: {
                    primary: prefersDarkMode ? '#ffffff' : '#000000',
                },
            },
        }), [prefersDarkMode]);

    useEffect(() => {
        if (prefersDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [prefersDarkMode]);

    const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Calendar);
    const [selectedDateForCashRegister, setSelectedDateForCashRegister] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [, setExitingTab] = useState<Tab | null>(null);
    const [direction, setDirection] = useState<'enter' | 'exit'>('enter');

    const handleTabChange = (tab: Tab) => {
        if (selectedTab !== tab) {
            setExitingTab(selectedTab);
            setDirection('exit');
            setBGColor(prefersDarkMode ? "#1a1a1a" : "#ffffff");

            setTimeout(() => {
                setSelectedTab(tab);
                setDirection('enter');
                setExitingTab(null);
            }, 400);
        }
    };

    const handleUpdateBGColor = (color: string, date: string) => {
        setExitingTab(selectedTab);
        setDirection('exit');

        setSelectedDateForCashRegister(date);
        setSelectedTab(Tab.CashRegister);
        setDirection('enter');
        setExitingTab(null);

        const darkModeColor = prefersDarkMode ? adjustColorForDarkMode(color) : color;

        setTimeout(() => {
            setBGColor(darkModeColor);
        }, 200);
    }

    const adjustColorForDarkMode = (color: string) => {
        if (color.includes('dark:')) return color;
        if (color.includes('bg-blue-50')) return prefersDarkMode ? 'bg-blue-900' : color;
        if (color.includes('bg-blue-100')) return prefersDarkMode ? 'bg-blue-800' : color;
        if (color.includes('bg-blue-200')) return prefersDarkMode ? 'bg-blue-700' : color;
        if (color.includes('bg-blue-300')) return prefersDarkMode ? 'bg-blue-600' : color;
        if (color.includes('bg-gray-100') || color.includes('bg-gray-200')) return prefersDarkMode ? 'bg-gray-800' : color;

        return prefersDarkMode ? '#1a1a1a' : color;
    }

    const renderTab = (tab: Tab) => {
        switch (tab) {
            case Tab.Calendar:
                return <Calendar onClick={handleUpdateBGColor} key="calendar" direction={direction}/>;
            case Tab.CashRegister:
                return <CashRegister date={selectedDateForCashRegister} key="cashregister" direction={direction}/>;
            case Tab.Objects:
                return <EditProducts key="editproducts" direction={direction}/>;
            case Tab.History:
                return <History key="history" />
            default:
                return null;
        }
    }

    const [BGColor, setBGColor] = useState<string>(prefersDarkMode ? "#1a1a1a" : "#ffffff");

    return (
        <ThemeProvider theme={theme}>
            <div className="absolute top-0 left-0 w-full h-full flex bg-white dark:bg-gray-950">
                <NavBar selectedTab={selectedTab} onTabSelected={handleTabChange}/>
                <div className={`flex-1 ${BGColor} transition-all duration-1000 overflow-hidden`}>
                    <AnimatePresence mode="wait">
                        {renderTab(selectedTab)}
                    </AnimatePresence>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;
