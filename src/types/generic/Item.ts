export interface Item {
    name: string;
    quantity: number;
    price: number;
    image?: string; // Represents the file path (e.g., file://...)
}