import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import {Order} from "../types/generic/Order.ts";
import {t} from "i18next";
import { useTranslation } from 'react-i18next';

interface HistoryProps {
    date?: string;
}

interface OrdersByDate {
    [date: string]: Order[];
}

const History: React.FC<HistoryProps> = () => {
    const { i18n } = useTranslation();

    // Animation variants for both entering and exiting
    const variants = {
        enter: {
            opacity: 1,
            y: 0,
            transition: {duration: 0.4, ease: "easeOut", delay: 0.3}
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: {duration: 0.3, ease: "easeIn"}
        }
    };

    const [ordersByDate, setOrdersByDate] = useState<OrdersByDate>({});
    const [expandedDates, setExpandedDates] = useState<string[]>([]);
    const [expandedOrders, setExpandedOrders] = useState<number[]>([]);

    useEffect(() => {
        window.ipcRenderer
            .invoke("getOrders")
            .then((fetchedOrdersByDate: OrdersByDate) => {
                setOrdersByDate(fetchedOrdersByDate);
            })
            .catch((err: any) => {
                console.error(err);
            });
    }, []);

    const toggleDateExpansion = (date: string) => {
        setExpandedDates(prev =>
            prev.includes(date)
                ? prev.filter(d => d !== date)
                : [...prev, date]
        );
    };

    const toggleOrderExpansion = (orderId: number) => {
        setExpandedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="absolute right-0 bottom-0 pb-0 border border-b-0 border-gray-200 dark:border-gray-600 rounded-t-xl bg-transparent p-8 w-[calc(100%-100px)] h-[calc(100%-50px)] text-black dark:text-white flex flex-col"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <h1 className="text-3xl font-bold mb-6">⌛ {t("orderHistory")}</h1>
                <div className="flex-1 overflow-y-auto pr-4">
                    {Object.keys(ordersByDate).length === 0 ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                            {t("noOrders")}
                        </div>
                    ) : (
                        Object.entries(ordersByDate).map(([date, dateOrders]) => (
                            <div
                                key={date}
                                className="mb-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                            >
                                <div
                                    className="bg-gray-100 dark:bg-gray-800 p-4 cursor-pointer flex justify-between items-center"
                                    onClick={() => toggleDateExpansion(date)}
                                >
                                    <h2 className="text-xl font-semibold">
                                        {new Date(date).toLocaleDateString(i18n.language, {dateStyle: 'long'})}
                                    </h2>
                                    <span className="text-gray-500 dark:text-gray-400">
                                        {expandedDates.includes(date) ? "▼" : "►"}
                                    </span>
                                </div>

                                {expandedDates.includes(date) && (
                                    <div className="p-2">
                                        {dateOrders.map(order => (
                                            <div
                                                key={order.id}
                                                className="border border-gray-200 dark:border-gray-800 rounded-lg mb-2 overflow-hidden"
                                            >
                                                <div
                                                    className="bg-gray-50 dark:bg-gray-800 p-3 cursor-pointer flex justify-between items-center"
                                                    onClick={() => order.id !== undefined && toggleOrderExpansion(order.id)}
                                                >
                                                    <div>
                            <span className="font-medium">
                              {t("order")} #{order.id}
                            </span>
                                                        <span className="ml-4 text-gray-500 dark:text-gray-400">
                              {order.date ? new Date(order.date).toLocaleTimeString(undefined, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                  hour12: false
                              }) : ""}
                            </span>
                                                    </div>
                                                    <div className="flex items-center">
                            <span className="font-bold mr-4">
                              €{order.totalPrice.toFixed(2)}
                            </span>
                                                        <span className="text-gray-500 dark:text-gray-400">
                              {order.id !== undefined && expandedOrders.includes(order.id) ? "▼" : "►"}
                            </span>
                                                    </div>
                                                </div>

                                                {order.id !== undefined && expandedOrders.includes(order.id) && (
                                                    <div className="p-3">
                                                        <table className="w-full">
                                                            <thead>
                                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                                <th className="text-left py-2">{t("product")}</th>
                                                                <th className="text-right py-2">{t("price")}</th>
                                                                <th className="text-right py-2">{t("quantity")}</th>
                                                                <th className="text-right py-2">{t("total")}</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody>
                                                            {order.items.map(item => (
                                                                <tr
                                                                    key={item.id}
                                                                    className="border-b border-gray-200 dark:border-gray-700"
                                                                >
                                                                    <td className="py-2">{item.itemName}</td>
                                                                    <td className="text-right py-2">€{item.itemPrice.toFixed(2)}</td>
                                                                    <td className="text-right py-2">{item.quantity}</td>
                                                                    <td className="text-right py-2 font-medium">
                                                                        €{(item.itemPrice * item.quantity).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="font-bold">
                                                                <td colSpan={3}
                                                                    className="text-right py-2">{t("total")}</td>
                                                                <td className="text-right py-2">€{order.totalPrice.toFixed(2)}</td>
                                                            </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default History;
