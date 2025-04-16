import React from "react";
import {Item} from "../../types/generic/Item.ts";

interface ProductCardProps {
    item: Item;
}

const ProductCard: React.FC<ProductCardProps> = ({ item }) => {
    return (
        <div
            className="rounded-xl shadow cursor-pointer hover:-translate-y-1 transition-all active:scale-95 border dark:border-gray-600 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm">No Image</span>
                )}
            </div>
            <h2 className="font-bold text-lg ml-2 mt-2 truncate">{item.name}</h2>
            <h3 className="ml-2 mb-2">€{item.price.toFixed(2)}</h3>
        </div>
    )
}

export default ProductCard;