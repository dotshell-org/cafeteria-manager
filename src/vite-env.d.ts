/// <reference types="vite/client" />
import { TimeFrame } from './types/DailySales';
import { Order } from './types/generic/Order';

interface Window {
  electron: {
    getItemsForUI: () => Promise<any>
    getGroups: () => Promise<any>
    getProducts: () => Promise<any>
    getOrders: (limit: number) => Promise<any>
    getMultipleDaysSales: (from: string, to: string) => Promise<any>
    getDailySales: (date: string) => Promise<any>
    addProduct: (product: any) => Promise<any>
    updateProduct: (product: any) => Promise<any>
    deleteProduct: (productId: number) => Promise<any>
    saveImage: (base64Image: string, filename: string) => Promise<string>
    saveOrder: (order: Order) => Promise<any>
    getRevenueData: (timeframe: TimeFrame, startDate: string | null, endDate: string | null) => Promise<any>
    getOrderCountData: (timeframe: TimeFrame, startDate: string | null, endDate: string | null) => Promise<any>
    getProductSalesData: (startDate: string, endDate: string) => Promise<any>
    
    // Export functions
    getWeeklySalesReport: (weekStartDate: string) => Promise<any>
    getAllOrders: () => Promise<any>
    getSalesSummary: (startDate: string, endDate: string) => Promise<any>
    getAllProductsForExport: () => Promise<any>
  }
}
