import {app, BrowserWindow, ipcMain, protocol} from 'electron';
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs';
import crypto from 'node:crypto';
import '../src/backend/db/tables.js'
import {
  getGroups, 
  getItemsForUI, 
  getProducts, 
  getOrders, 
  getMultipleDaysSales, 
  getDailySales,
} from "../src/backend/db/getters.js";
import { addProduct, updateProduct, deleteProduct, saveOrder } from '../src/backend/db/setters.js';
import { getRevenueData, getOrderCountData, getProductSalesData } from '../src/backend/db/getStats.js';
import { getWeeklySalesReport, getAllOrders, getSalesSummary, getAllProducts } from '../src/backend/export/exportData.js';
import {Product} from "../src/types/generic/Product.js";
import {getLanguagePreference, saveLanguagePreference} from "../src/backend/db/settings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- Image Storage Setup ---
const USER_DATA_PATH = app.getPath('userData');
const IMAGES_DIR = path.join(USER_DATA_PATH, 'product_images');

// Ensure image directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}
// --- End Image Storage Setup ---

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = VITE_DEV_SERVER_URL 
  ? path.join(process.env.APP_ROOT, 'dist')
  : path.join(__dirname, '../dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL 
  ? path.join(process.env.APP_ROOT, 'public') 
  : path.join(__dirname, '../public')

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    minWidth: 1000,
    minHeight: 650,
    icon: path.join(process.env.VITE_PUBLIC || '', 'app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      webSecurity: true,
    },
  })

  // Hide menu bar
  win.setMenuBarVisibility(false)

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL).then(() => {
      if (!win) {
        throw new Error('"win" is not defined')
      }
    })
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html')).then(() => {
      if (!win) {
        throw new Error('"win" is not defined')
      }
    })
  }
}

// --- IPC Handlers ---

// Helper function to save image data
async function saveImageData(base64Data: string, originalFileName: string): Promise<string> {
    try {
        const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid base64 data format');
        }
        const dataBuffer = Buffer.from(matches[2], 'base64');
        const fileExtension = path.extname(originalFileName) || '.png'; // Default to png if no extension
        const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}${fileExtension}`;
        const filePath = path.join(IMAGES_DIR, uniqueFilename);

        await fs.promises.writeFile(filePath, dataBuffer);
        // Return the file path using the file:// protocol for renderer access
        return `file://${filePath}`;
    } catch (error) {
        console.error('Failed to save image:', error);
        throw error; // Re-throw the error to be caught by handleIpc
    }
}

// Helper function to delete an image file
async function deleteImageFile(imagePath: string | null | undefined): Promise<void> {
    if (!imagePath || !imagePath.startsWith('file://')) return; // Only delete files managed by the app

    const filePath = fileURLToPath(imagePath);
    try {
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
            console.log(`Deleted image: ${filePath}`);
        }
    } catch (error) {
        console.error(`Failed to delete image ${filePath}:`, error);
    }
}

function handleIpc(name: string, handler: (...args: any[]) => any) {
  ipcMain.handle(name, async (_event, ...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(`Error in ${name}`, error);
      throw error;
    }
  });
}

// --- Database Operation Handlers with Image Logic ---

handleIpc('getItemsForUI', getItemsForUI);
handleIpc('getGroups', getGroups);
handleIpc('getProducts', getProducts);
handleIpc('getOrders', getOrders);
handleIpc('getMultipleDaysSales', getMultipleDaysSales);
handleIpc('getDailySales', getDailySales);
handleIpc('getRevenueData', getRevenueData);
handleIpc('getOrderCountData', getOrderCountData);
handleIpc('getProductSalesData', getProductSalesData);

// Export data handlers
handleIpc('getWeeklySalesReport', getWeeklySalesReport);
handleIpc('getAllOrders', getAllOrders);
handleIpc('getSalesSummary', getSalesSummary);
handleIpc('getAllProductsForExport', getAllProducts);

// Settings
handleIpc("saveLanguagePreference", saveLanguagePreference);
handleIpc("getLanguagePreference", getLanguagePreference);

handleIpc('addProduct', async (product: Omit<Product, 'id'>) => {
    return addProduct(product);
});

handleIpc('updateProduct', async (product: Product) => {
    const oldProduct = getProducts().find((p: Product) => p.id === product.id);
    const oldImagePath = oldProduct?.image;

    updateProduct(product);

    if (oldImagePath && oldImagePath !== product.image) {
        await deleteImageFile(oldImagePath);
    }
});

handleIpc('deleteProduct', async (productId: number) => {
    const productToDelete = getProducts().find((p: Product) => p.id === productId);
    const imagePathToDelete = productToDelete?.image;

    deleteProduct(productId);

    if (imagePathToDelete) {
        await deleteImageFile(imagePathToDelete);
    }
});

handleIpc('saveImage', async (base64Data: string, originalFileName: string) => {
    return await saveImageData(base64Data, originalFileName);
});

handleIpc('saveOrder', (order) => {
    return saveOrder(order);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Ajout de la configuration du protocole file pour permettre l'accès aux fichiers
app.whenReady().then(() => {
  // Permettre l'accès aux fichiers locaux (protocole file://)
  protocol.registerFileProtocol('file', (request, callback) => {
    const pathname = decodeURI(request.url.replace('file:///', ''));
    callback(pathname);
  });

  createWindow();
});
