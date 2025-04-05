import { useMemo, useState } from 'react';
import { useMediaQuery, createTheme, ThemeProvider } from '@mui/material';

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

    return (
        <ThemeProvider theme={theme}>
            <h1 className="text-red-500">Cafeteria Manager</h1>
        </ThemeProvider>
    );
}

export default App;