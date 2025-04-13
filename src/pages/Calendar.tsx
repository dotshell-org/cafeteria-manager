import React, { useState, useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/fr'; // For displaying days in French
import { motion, AnimatePresence } from 'framer-motion'; // Import framer-motion

// Format days: "Mon 12 April"
const formatDate = (date: string | number | dayjs.Dayjs | Date | null | undefined) => {
    return dayjs(date).locale('fr').format('ddd D MMMM');
};

// Generate an array of 7 days starting from a given date
const generateDays = (centralDate: dayjs.Dayjs) => {
    const startDate = centralDate.subtract(3, 'day'); // Start 3 days before central date
    return Array.from({ length: 7 }, (_, i) => startDate.add(i, 'day'));
};

interface CalendarInterface {
    onClick: (color: string, date: string) => void;
    direction: 'enter' | 'exit';
}

const Calendar: React.FC<CalendarInterface> = ({ onClick }) => {
    // State for the central date (default is today)
    const [currentDate, setCurrentDate] = useState(dayjs());
    // State for displayed dates
    const [displayedDays, setDisplayedDays] = useState(generateDays(currentDate));
    // Direction of animation (1 for right, -1 for left)
    const [animDirection, setAnimDirection] = useState(0);

    // Reference for scroll management
    const scrollContainerRef = useRef(null);

    // Generate new days when the central date changes
    useEffect(() => {
        setDisplayedDays(generateDays(currentDate));
    }, [currentDate]);

    // Function to navigate to previous days
    const navigateToPreviousDays = () => {
        setAnimDirection(-1); // Set direction for animation
        setCurrentDate(currentDate.subtract(7, 'day')); // Move 7 days instead of 5
    };

    // Function to navigate to next days
    const navigateToNextDays = () => {
        setAnimDirection(1); // Set direction for animation
        setCurrentDate(currentDate.add(7, 'day')); // Move 7 days instead of 5
    };

    // Function to return to today
    const goToToday = () => {
        setAnimDirection(0); // Neutral direction
        setCurrentDate(dayjs());
    };

    // Function to trigger slide up animation and update background color
    const handleSlideUp = (color: string, date: string) => {
        // Use a timeout to delay the sliding animation
        setTimeout(() => {
            onClick(color, date);
        }, 500);
    };

    // Animation variants for the container
    const containerVariants = {
        visible: {
            transition: {
                staggerChildren: 0.1, // Delay between each child animation
                delayChildren: 0.3, // Initial delay before starting children animations
            },
        },
        exit: {
            transition: {
                staggerChildren: 0.05, // Slightly faster stagger on exit
                staggerDirection: animDirection > 0 ? 1 : -1, // Direction of staggering
            },
        },
    };

    // Animation variants for individual items
    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 50, // Always enter from bottom (positive value)
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 24,
                duration: 0.4,
            },
        },
        exit: {
            opacity: 0,
            y: 50, // Always exit to bottom (positive value)
            transition: {
                duration: 0.3,
            },
        },
    };

    // Animation variants for slide up
    const slideUpVariants = {
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4, ease: "easeOut" }
        },
        hidden: {
            opacity: 0,
            y: 40,
            transition: { duration: 0.3, ease: "easeIn" }
        }
    };

    // Animation variants for buttons
    const buttonVariants = {
        visible: {
            opacity: 1,
            transition: {
                delay: 0.5,
            }
        },
        hidden: { opacity: 0 },
    };

    return (
        <motion.div
            className="h-full flex flex-col p-2"
            initial={{ opacity: 0, y: 40 }}
            animate="visible"
            exit="hidden"
            variants={slideUpVariants}
        >
            <motion.div
                className="flex justify-between items-center mt-5 mb-2"
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={containerVariants}
            >
                <motion.button
                    onClick={navigateToPreviousDays}
                    className="p-2 rounded-lg bg-gray-100"
                    variants={buttonVariants}
                >
                    <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 19.5L8.25 12l7.5-7.5"
                        />
                    </svg>
                </motion.button>

                <motion.button
                    onClick={goToToday}
                    className="bg-gray-100"
                    variants={buttonVariants}
                >
                    Today
                </motion.button>

                <motion.button
                    onClick={navigateToNextDays}
                    className="p-2 rounded-lg bg-gray-100"
                    variants={buttonVariants}
                >
                    <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                        />
                    </svg>
                </motion.button>
            </motion.div>

            <div className="mt-14 h-6 grid grid-cols-7 text-center">
                <AnimatePresence mode="wait" custom={animDirection}>
                    <motion.div
                        key={currentDate.format('YYYY-MM-DD') + '-header'}
                        className="col-span-7 grid grid-cols-7"
                        custom={animDirection}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {displayedDays.map((day, index) => (
                            <motion.div
                                key={index}
                                className={
                                    day.isSame(dayjs(), 'day')
                                        ? 'font-bold text-blue-600'
                                        : ''
                                }
                                custom={animDirection}
                                variants={itemVariants}
                            >
                                {formatDate(day)}
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div
                ref={scrollContainerRef}
                className="mt-2 flex-grow overflow-auto"
            >
                <AnimatePresence mode="wait" custom={animDirection}>
                    <motion.div
                        key={currentDate.format('YYYY-MM-DD') + '-content'}
                        className="grid grid-cols-7 text-center h-[calc(100%-5rem)]"
                        custom={animDirection}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {displayedDays.map((day, index) => {
                            const bgColor =
                                day.day() === 0 // Sunday
                                    ? 'bg-gray-100 text-gray-400'
                                    : day.day() === 6 // Saturday
                                        ? 'bg-gray-200 text-gray-400'
                                        : [
                                            'bg-blue-50 text-blue-300',
                                            'bg-blue-100 text-blue-400',
                                            'bg-blue-200 text-blue-400',
                                            'bg-blue-300 text-blue-500',
                                            'bg-blue-400 text-blue-600',
                                        ][day.day() - 1];

                            return (
                                <motion.div
                                    key={index}
                                    custom={animDirection}
                                    variants={itemVariants}
                                    className={`p-5 m-1 my-0 ${
                                        index > 0 ? 'ml-1.5' : ''
                                    } ${
                                        index < 6 ? 'mr-1.5' : ''
                                    } rounded-lg h-full ${bgColor} hover:mt-1 transition-all cursor-pointer`}
                                    onClick={() => handleSlideUp(bgColor, day.format('YYYY-MM-DD'))}
                                >
                                    <h1 className="flex items-center justify-center h-full opacity-80">
                                        €0.0
                                    </h1>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default Calendar;
