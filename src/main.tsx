import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// 1. Import MUI utilities (Notice we added CssBaseline here!)
import { ThemeProvider as MuiThemeProvider, createTheme } from "@mui/material/styles"; 
import CssBaseline from "@mui/material/CssBaseline"; 

// 2. Import your Tailwind context AND the useTheme hook
import { ThemeProvider as TailwindThemeProvider, useTheme } from './contexts/theme.context.tsx'; 
import { LoaderProvider } from './contexts/loader.context.tsx';

// --- THE FIX: This wrapper forces MUI to listen to your toggle button ---
const DynamicMuiTheme = ({ children }: { children: React.ReactNode }) => {
    // Read the current state ("light" or "dark") from your Tailwind button
    const { theme } = useTheme(); 

    // Generate a new MUI theme whenever the state changes
    const muiTheme = useMemo(() => createTheme({
        palette: {
            mode: theme, // Tells MUI to turn DataGrids, Accordions, and TextFields dark
        },
    }), [theme]);

    return (
        <MuiThemeProvider theme={muiTheme}>
            {/* CssBaseline is mandatory! It tells MUI to actually paint the dark backgrounds */}
            <CssBaseline /> 
            {children}
        </MuiThemeProvider>
    );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TailwindThemeProvider> 
      
      {/* Replace the old static MuiThemeProvider with our new Dynamic one */}
      <DynamicMuiTheme>
        <LoaderProvider>
          <App />
        </LoaderProvider>
      </DynamicMuiTheme>

    </TailwindThemeProvider>
  </StrictMode>,
)