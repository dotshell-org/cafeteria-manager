import React from "react";
import {motion} from "framer-motion";

interface CashRegisterProps {
    date: string;
    direction: 'enter' | 'exit';
}

const CashRegister: React.FC<CashRegisterProps> = ({date}) => {
    // Animation variants for both entering and exiting
    const variants = {
        enter: {
            opacity: 1,
            y: 0,
            transition: {duration: 0.4, ease: "easeOut", delay: 0.5} // Added delay before enter
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: {duration: 0.3, ease: "easeIn"}
        }
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="absolute right-0 bottom-0 rounded-tl-2xl bg-white p-8 w-[calc(100%-100px)] h-[calc(100%-50px)]"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <h1 className="text-3xl text-black">{date}</h1>
            </motion.div>
        </div>
    )
}

export default CashRegister;