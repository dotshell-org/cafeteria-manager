import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Animation variants
const variants = {
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut", delay: 0.3 }
    },
    exit: {
        opacity: 0,
        y: 40,
        transition: { duration: 0.3, ease: "easeIn" }
    }
};

const Settings: React.FC = () => {
    const { t, i18n } = useTranslation();
    
    // Function to change language
    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="h-full flex flex-col p-8 pb-0 overflow-y-auto"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <h1 className="text-3xl font-bold mt-4 mb-6">⚙️ {t("settings")}</h1>
                
                <div className="relative h-full">
                    <div className="absolute inset-0 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg overflow-hidden">
                        <div className="p-6 mb-6 overflow-y-auto h-full">
                            <h2 className="text-xl font-bold mb-4">{t("language")}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t("languageDescription")}
                            </p>
                            
                            <div className="flex gap-2 mb-6">
                                <button 
                                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                                        i18n.language === "en" 
                                        ? "bg-blue-500 text-white dark:bg-blue-700" 
                                        : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                                    }`}
                                    onClick={() => changeLanguage("en")}
                                >
                                    English
                                </button>
                                <button 
                                    className={`px-4 py-2 rounded-md font-medium transition-all ${
                                        i18n.language === "fr" 
                                        ? "bg-blue-500 text-white dark:bg-blue-700" 
                                        : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                                    }`}
                                    onClick={() => changeLanguage("fr")}
                                >
                                    Français
                                </button>
                            </div>
                            
                            <h2 className="text-xl font-bold mb-4 mt-8">{t("appearance")}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                {t("appearanceDescription")}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 italic">
                                {t("themeFollowsSystem")}
                            </p>
                            
                            <h2 className="text-xl font-bold mb-4 mt-8">{t("about")}</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                                {t("aboutDescription")}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400">
                                Cafeteria Manager v1.0.0
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Settings;