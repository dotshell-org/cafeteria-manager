export interface Order {
    id: number;
    date: string;
    totalPrice: number;
    items: {
        id: number;
        orderId: number;
        itemName: string;
        itemPrice: number;
        quantity: number;
    }[];
}