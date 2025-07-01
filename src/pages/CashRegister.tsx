import React, {useEffect, useState} from "react";
import {motion} from "framer-motion";
import SearchBar from "../components/generic/SearchBar";
import ItemGroupChoiceBar from "../components/generic/ItemGroupChoiceBar";
import {Item} from "../types/generic/Item";
import {ItemGroup} from "../types/generic/ItemGroup";
import ProductCard from "../components/cash-register/ProductCard";
import { IpcRenderer } from "electron";
import {t} from "i18next";
import { Order } from "../types/generic/Order";

// Define the extended Window interface
declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

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
            transition: {duration: 0.4, ease: "easeOut", delay: 0.3}
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: {duration: 0.3, ease: "easeIn"}
        }
    };

    const [groups, setGroups] = useState<ItemGroup[]>([]);
    const handleGroupSelected = (id: number) => {
        setGroups(prevGroups =>
            prevGroups.map((group, index) =>
                index === id ? {...group, selected: !group.selected} : group
            )
        );
    }

    useEffect(() => {
        window.ipcRenderer
            .invoke("getGroups")
            .then((groups: ItemGroup[]) => {
                setGroups(groups);
            })
            .catch((err: any) => {
                console.error(err);
            })
    }, []);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [itemsInUI, setItemsInUI] = useState<Item[]>([]);
    const [itemsInCommand, setItemsInCommand] = useState<Item[]>([]);
    const [orderStatus, setOrderStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    useEffect(() => {
        window.ipcRenderer
            .invoke("getItemsForUI", groups, searchTerm)
            .then((items: Item[]) => {
                setItemsInUI(items);
            })
            .catch((err: any) => {
                console.error(err);
            })
    }, [groups, searchTerm]);

    const handleValidateOrder = () => {
        // Check if there are items in the order
        if (itemsInCommand.length === 0) {
            return;
        }

        // Set status to saving
        setOrderStatus('saving');

        // Calculate total price
        const totalPrice = itemsInCommand.reduce((acc, item) => acc + item.quantity * item.price, 0);

        // Create order object with current time
        const now = new Date();

        // Use the date from props but add current time
        const [year, month, day] = date.split('-');

        // Format hours, minutes, seconds with leading zeros
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        // Create datetime string in format YYYY-MM-DDThh:mm:ss
        const orderDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

        const order: Omit<Order, 'id' | 'createdAt'> = {
            date: orderDateTime,
            totalPrice: totalPrice,
            items: itemsInCommand.map(item => ({
                id: 0,
                orderId: 0,
                itemName: item.name,
                itemPrice: item.price,
                quantity: item.quantity
            }))
        };

        // Save order
        window.ipcRenderer
            .invoke("saveOrder", order)
            .then(() => {
                setOrderStatus('success');
                // Clear the order after successful save
                setItemsInCommand([]);
                // Reset status after 3 seconds
                setTimeout(() => {
                    setOrderStatus('idle');
                }, 3000);
            })
            .catch((err: any) => {
                console.error(err);
                setOrderStatus('error');
                // Reset status after 3 seconds
                setTimeout(() => {
                    setOrderStatus('idle');
                }, 3000);
            });
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="absolute right-0 bottom-0 pb-0 rounded-tl-2xl shadow-xl shadow-transparent dark:shadow-gray-200 bg-white dark:bg-gray-900 p-8 w-[calc(100%-100px)] h-[calc(100%-50px)] text-black dark:text-white flex"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <div className="flex-1 h-full p-4 pt-6 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-600">
                    <SearchBar placeholder={t("searchForProducts")} onSearch={setSearchTerm} />
                    <ItemGroupChoiceBar groups={groups} onGroupSelected={handleGroupSelected} />
                    <div
                        className="w-full max-h-[calc(100vh-200px)] pr-3 pb-6 pt-2 overflow-y-auto grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mt-4">
                        {itemsInUI.map((item, index) => {
                            return (
                                <div key={index} onClick={() => {
                                    setItemsInCommand((prevItems) => {
                                        const existingItem = prevItems.find((commandItem) => commandItem.name === item.name);
                                        if (existingItem) {
                                            return prevItems.map((commandItem) =>
                                                commandItem.name === item.name
                                                    ? {...commandItem, quantity: commandItem.quantity + 1}
                                                    : commandItem
                                            );
                                        } else {
                                            return [...prevItems, {...item, quantity: 1}];
                                        }
                                    });
                                }}>
                                    <ProductCard item={item} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="w-80 h-full p-4 rounded-t-xl ml-8 border border-b-0 border-gray-200 dark:border-gray-600">
                    <div className="flex flex-col h-[calc(100%-12rem)]">
                        <h1 className="text-2xl text-black" style={{display: 'none'}}>{date}</h1>
                        <h1 className="text-2xl mt-4 text-black dark:text-white">{t("order")}</h1>
                        <div
                            className="flex-1 mt-3 py-2 rounded-xl shadow border dark:border-gray-600 overflow-y-auto"
                        >
                            {
                                itemsInCommand.map((item, index) => {
                                    return (
                                        <div
                                            key={item.name}
                                            className={`flex justify-between items-center mx-4 p-2 ${index !== itemsInCommand.length - 1 && "border-b"} dark:border-gray-700`}
                                            onClick={() => {
                                                setItemsInCommand(prevItems => {
                                                    const updatedItems = prevItems.reduce<Item[]>((acc, curr) => {
                                                        if (curr.name === item.name) {
                                                            if (curr.quantity > 1) {
                                                                acc.push({...curr, quantity: curr.quantity - 1});
                                                            }
                                                        } else {
                                                            acc.push(curr);
                                                        }
                                                        return acc;
                                                    }, []);
                                                    return updatedItems;
                                                });
                                            }}
                                        >
                                            <motion.div
                                                className="flex justify-between items-center w-full cursor-pointer"
                                                initial={{scale: 1}}
                                                whileTap={{scale: 0.9}}
                                                transition={{duration: 0.2}}
                                            >
                                                <div>
                                                    <h3 className="text-lg font-medium text-black dark:text-white">{item.name}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{t("quantity")}: {item.quantity}</p>
                                                </div>
                                                <span className="text-lg font-bold text-black dark:text-white">
                                                    €{(item.quantity * item.price).toFixed(2)}
                                                </span>
                                            </motion.div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </div>
                    <div
                        className="w-full h-10 mt-8 flex items-center justify-between">
                        <span className="text-2xl mt-3 text-black dark:text-white">{t("total")}</span>
                        <span className="text-2xl mt-4 font-bold text-black dark:text-white">€{itemsInCommand.reduce((acc, item) => acc + item.quantity * item.price, 0).toFixed(2)}</span>
                    </div>
                    <button
                        className={`w-full mt-4 p-2 text-center text-lg rounded-md transition-colors cursor-pointer ${
                            orderStatus === 'idle' 
                                ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700' 
                                : orderStatus === 'saving' 
                                    ? 'bg-blue-100 dark:bg-blue-800 cursor-wait' 
                                    : orderStatus === 'success' 
                                        ? 'bg-green-100 dark:bg-green-800' 
                                        : 'bg-red-100 dark:bg-red-800'
                        }`}
                        onClick={handleValidateOrder}
                        disabled={orderStatus !== 'idle' || itemsInCommand.length === 0}
                    >
                        {orderStatus === 'idle'
                            ? t("validate")
                            : orderStatus === 'saving'
                                ? t("saving") + '...'
                                : orderStatus === 'success'
                                    ? t("orderSaved")
                                    : t("error")}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default CashRegister;
