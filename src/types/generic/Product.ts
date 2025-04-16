export interface Product {
    id: number; // Add ID field
    name: string;
    price: number;
    group: string;
    image?: string; // Represents the file path (e.g., file://...)
}