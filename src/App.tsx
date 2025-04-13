import {useMemo, useState} from 'react';
import { useMediaQuery, createTheme, ThemeProvider } from '@mui/material';
import Calendar from "./pages/Calendar.tsx";
import NavBar from "./components/nav/NavBar.tsx";
import {Tab} from "./types/nav/Tab.ts";
import CashRegister from "./pages/CashRegister.tsx";
import dayjs from "dayjs";
import { AnimatePresence } from 'framer-motion';

function App() {

    // Check if user prefers dark mode
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    // Create theme dynamically based on preference
    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode: prefersDarkMode ? 'dark' : 'light',
                text: {
                    primary: prefersDarkMode ? '#ffffff' : '#000000',
                },
            },
        }), [prefersDarkMode]);

    const [selectedTab, setSelectedTab] = useState<Tab>(Tab.Calendar);
    const [selectedDateForCashRegister, setSelectedDateForCashRegister] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [, setExitingTab] = useState<Tab | null>(null);
    const [direction, setDirection] = useState<'enter' | 'exit'>('enter');
    
    const handleTabChange = (tab: Tab) => {
        if (selectedTab !== tab) {
            setExitingTab(selectedTab);
            setDirection('exit');
            setBGColor("#ffffff");
            
            // Delay the actual tab change to allow for exit animation
            setTimeout(() => {
                setSelectedTab(tab);
                setDirection('enter');
                setExitingTab(null);
            }, 400); // Match this with your exit animation duration
        }
    };

    const handleUpdateBGColor = (color: string, date: string) => {
        setExitingTab(selectedTab);
        setDirection('exit');

        setSelectedDateForCashRegister(date);
        setSelectedTab(Tab.CashRegister);
        setDirection('enter');
        setExitingTab(null);

        setTimeout(() => {
            setBGColor(color);
        }, 200);
    }

    const renderTab = (tab: Tab) => {
        switch (tab) {
            case Tab.Calendar:
                return <Calendar onClick={handleUpdateBGColor} key="calendar" direction={direction} />;
            case Tab.CashRegister:
                return <CashRegister date={selectedDateForCashRegister} key="cashregister" direction={direction} />;
            default:
                return null;
        }
    }

    const [BGColor, setBGColor] = useState<string>("#ffffff");

    return (
        <ThemeProvider theme={theme}>
            <div className="absolute top-0 left-0 w-full h-full flex bg-white dark:bg-gray-950">
                <NavBar selectedTab={selectedTab} onTabSelected={handleTabChange} />
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