// src/widgets/themetoggle.tsx
import { useTheme } from "@/contexts/theme.context";
import { Moon, Sun } from "lucide-react"; 

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Toggle Dark Mode"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
        >
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </button>
    );
};

export default ThemeToggle;