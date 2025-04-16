import {t} from "i18next";
import {useRef, useState, useEffect} from "react";
import {Product} from "../types/generic/Product.ts";
import { IpcRenderer } from "electron";
import { motion } from "framer-motion";
import { ItemGroup } from "../types/generic/ItemGroup.ts";

// Define the extended Window interface
declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

const DEFAULT_IMAGE = "";

interface EditProductsProps {
    direction?: 'enter' | 'exit';
}

const EditProducts: React.FC<EditProductsProps> = ({}) => {
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

    const [products, setProducts] = useState<Product[]>([]);
    const [isSavingImage, setIsSavingImage] = useState<Record<number, boolean>>({}); // Track saving state per product
    const [groups, setGroups] = useState<string[]>([]); // Store unique group names for autocomplete

    // Fetch products and groups on component mount
    useEffect(() => {
        // Fetch products
        window.ipcRenderer.invoke('getProducts')
            .then((fetchedProducts: Product[]) => {
                setProducts(fetchedProducts);
            })
            .catch(console.error);

        // Fetch groups for autocomplete
        window.ipcRenderer.invoke('getGroups')
            .then((fetchedGroups: ItemGroup[]) => {
                // Extract unique group names
                const uniqueGroupNames = fetchedGroups.map(group => group.name);
                setGroups(uniqueGroupNames);
            })
            .catch(console.error);
    }, []);

    const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleInputChange = (index: number, field: keyof Omit<Product, 'id' | 'image'>, value: string | number) => {
        const updatedProduct = { ...products[index], [field]: value };
        setProducts(prev => prev.map((p, i) => i === index ? updatedProduct : p));

        // Debounce or save on blur/button click might be better for performance
        // Only call updateProduct for non-image fields here
        window.ipcRenderer.invoke('updateProduct', updatedProduct).catch(console.error);
    };

    // Function to update product state and trigger backend update for image
    const updateProductImage = (index: number, imagePath: string | undefined) => {
        const updatedProduct = { ...products[index], image: imagePath };
        setProducts(prev => prev.map((p, i) => i === index ? updatedProduct : p));
        // Trigger backend update specifically for the image change (or full product update)
        window.ipcRenderer.invoke('updateProduct', updatedProduct).catch(console.error);
    };

    const handleImageChange = (index: number, file: File | null) => {
        if (!file) return;

        setIsSavingImage(prev => ({ ...prev, [index]: true })); // Set saving state for this item

        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Image = e.target?.result as string;
            const productId = products[index].id; // Get product ID for context

            try {
                // Send base64 data and original filename to main process for saving
                const savedImagePath = await window.ipcRenderer.invoke('saveImage', base64Image, file.name);

                // Update product state and trigger backend update with the new path
                updateProductImage(index, savedImagePath);

            } catch (error) {
                console.error(`Failed to save image for product ${productId}:`, error);
                // Handle error in UI if needed
            } finally {
                 setIsSavingImage(prev => ({ ...prev, [index]: false })); // Clear saving state
            }
        };
        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setIsSavingImage(prev => ({ ...prev, [index]: false })); // Clear saving state on error
        };
        reader.readAsDataURL(file);
    };

    const handleAddProduct = () => {
        const newProductBase = { name: "", price: 0, group: "", image: DEFAULT_IMAGE };
        window.ipcRenderer.invoke('addProduct', newProductBase)
            .then((newId: number) => {
                setProducts(prev => [...prev, { ...newProductBase, id: newId }]);
            })
            .catch(console.error);
    };

    const handleRemoveProduct = (index: number) => {
        const productIdToRemove = products[index].id;
        window.ipcRenderer.invoke('deleteProduct', productIdToRemove)
            .then(() => {
                setProducts(prev => prev.filter((_, i) => i !== index));
            })
            .catch(console.error);
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="h-full flex flex-col p-8 pb-0"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <h1 className="text-3xl font-bold mt-4">📝 {t("edit_products")}</h1>
                <button className="mb-4 mt-6 px-4 py-2 bg-transparent border border-blue-500 hover:bg-blue-500 text-blue-500 hover:text-white rounded-lg self-start transition-all" onClick={handleAddProduct}>+ {t("add_product")}</button>
                <div
                    className="flex-grow px-4 pb-6 border border-b-0 border-gray-200 dark:border-gray-600 rounded-t-xl overflow-y-auto">
                    <div className="w-full flex text-center py-3 border-b font-bold border-gray-200 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-950">
                        <p className="flex-1">{t("product")}</p>
                        <p className="flex-1">{t("price")}</p>
                        <p className="flex-1">{t("group")}</p>
                        <p className="flex-1">{t("image")}</p>
                        <p className="w-10"></p>
                    </div>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: {
                                    staggerChildren: 0.1, // Delay between each child
                                }
                            },
                            hidden: {}
                        }}
                    >
                        {products.map((product, index) => (
                            <motion.div
                                key={index}
                                variants={{
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 24
                                        }
                                    },
                                    hidden: {
                                        opacity: 0,
                                        y: 20
                                    }
                                }}
                                className={`w-full flex text-center items-center py-2 ${index !== products.length - 1 ? "border-b" : ""} border-gray-200 dark:border-gray-600`}>
                                <div className="flex-1 flex justify-center">
                                    <input
                                        className="w-full px-2 py-1 text-center border border-transparent hover:border-blue-500 bg-transparent rounded transition-all"
                                        value={product.name}
                                        onChange={e => handleInputChange(index, "name", e.target.value)}
                                        placeholder={t('product')}
                                    />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <input
                                        className="w-full px-2 py-1 text-center border border-transparent hover:border-blue-500 bg-transparent rounded transition-all"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={product.price}
                                        onChange={e => handleInputChange(index, "price", parseFloat(e.target.value) || 0)}
                                        placeholder={t('price')}
                                    />
                                </div>
                                <div className="flex-1 flex justify-center">
                                    <input
                                        className="w-full px-2 py-1 text-center border border-transparent hover:border-blue-500 bg-transparent rounded transition-all"
                                        value={product.group}
                                        onChange={e => handleInputChange(index, "group", e.target.value)}
                                        placeholder={t('group')}
                                        list="group-options"
                                    />
                                </div>
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded mb-1 mx-auto" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded mb-1 mx-auto flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                                            {t('no_image')}
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={el => fileInputRefs.current[index] = el}
                                        style={{display: 'none'}}
                                        onChange={e => handleImageChange(index, e.target.files?.[0] || null)}
                                    />
                                    <button
                                        className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border"
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                        type="button"
                                    >
                                        {isSavingImage[index]
                                            ? t('saving')
                                            : product.image ? t("change_image") : `+ ${t("image")}`
                                        }
                                    </button>
                                </div>
                                <div className="w-10 flex justify-center">
                                    <button
                                        className="w-7 h-7 text-sm p-0 rounded-full bg-gray-100 dark:bg-gray-800 hover:border-red-500 text-red-500 hover:text-red-700"
                                        onClick={() => handleRemoveProduct(index)}
                                        title="Supprimer"
                                        type="button"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* Datalist for group autocomplete */}
                <datalist id="group-options">
                    {groups.map((group, index) => (
                        <option key={index} value={group} />
                    ))}
                </datalist>
            </motion.div>
        </div>
    );
}

export default EditProducts;
