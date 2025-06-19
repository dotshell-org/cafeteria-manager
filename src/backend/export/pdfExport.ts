import { BrowserWindow } from 'electron';
import dayjs from 'dayjs';
import { getAllProducts, getWeeklySalesReport, getSalesSummary } from './exportData.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface WeeklyReportData {
    startDate: string;
    endDate: string;
    weekDays: string[];
    products: Array<{
        name: string;
        price: number;
        totalQuantity: number;
        totalRevenue: number;
        dailySales: Record<string, { quantity: number; revenue: number }>;
    }>;
    weeklyTotal: number;
}

interface SalesSummaryData {
    item_name: string;
    item_price: number;
    total_quantity: number;
    total_revenue: number;
}

/**
 * Generates HTML content for weekly sales report
 */
function generateWeeklyReportHTML(data: WeeklyReportData, locale: string = 'fr'): string {
    const startDate = dayjs(data.startDate).format('DD/MM/YYYY');
    const endDate = dayjs(data.endDate).format('DD/MM/YYYY');
    
    // Generate day headers
    const dayHeaders = data.weekDays.map(day => {
        const dayName = dayjs(day).format('ddd');
        const date = dayjs(day).format('DD/MM');
        return `<th><strong>${dayName}</strong><br/>${date}</th>`;
    }).join('');

    // Generate product rows
    const productRows = data.products.map(product => {
        const dailySales = data.weekDays.map(day => {
            const sales = product.dailySales[day] || { quantity: 0 };
            return `<td style="text-align: center;">${sales.quantity}</td>`;
        }).join('');

        return `
            <tr>
                <td><strong>${product.name}</strong><br/>(${product.price.toFixed(2)}€)</td>
                ${dailySales}
                <td style="text-align: right;"><strong>${product.totalQuantity}</strong></td>
                <td style="text-align: right;"><strong>${product.totalRevenue.toFixed(2)}€</strong></td>
            </tr>
        `;
    }).join('');

    // Find best performing products
    const bestSellingProduct = data.products.length > 0 ? 
        data.products.reduce((prev, current) => (prev.totalQuantity > current.totalQuantity) ? prev : current) : null;
    
    const mostProfitableProduct = data.products.length > 0 ? 
        data.products.reduce((prev, current) => (prev.totalRevenue > current.totalRevenue) ? prev : current) : null;

    const totalItems = data.products.reduce((sum, product) => sum + product.totalQuantity, 0);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Hebdomadaire de Ventes</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #3498db;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header h2 {
            color: #34495e;
            font-size: 18px;
            font-weight: normal;
        }
        
        .summary-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .total-revenue {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px 6px;
            text-align: left;
        }
        
        th {
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            font-weight: bold;
            text-align: center;
            font-size: 11px;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e8f4f8;
        }
        
        .analysis-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #3498db;
        }
        
        .analysis-section h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        
        .stat-item {
            margin-bottom: 10px;
            padding: 8px 0;
        }
        
        .stat-label {
            font-weight: bold;
            color: #34495e;
        }
        
        .stat-value {
            color: #27ae60;
            font-weight: bold;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #7f8c8d;
            font-size: 12px;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        
        @page {
            margin: 20mm 15mm;
            size: A4;
        }
        
        @media print {
            body {
                max-width: none;
                margin: 0;
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Rapport Hebdomadaire de Ventes</h1>
        <h2>Période du ${startDate} au ${endDate}</h2>
    </div>

    <div class="summary-section">
        <div class="total-revenue">💰 ${data.weeklyTotal.toFixed(2)}€</div>
        <div>Recette totale de la semaine</div>
    </div>

    <h3>📈 Détail des Ventes par Produit</h3>
    <table>
        <thead>
            <tr>
                <th>Produit</th>
                ${dayHeaders}
                <th>Total</th>
                <th>Recette</th>
            </tr>
        </thead>
        <tbody>
            ${productRows}
        </tbody>
    </table>

    ${data.products.length > 0 ? `
    <div class="analysis-section">
        <h3>📈 Analyse des Performances</h3>
        
        ${bestSellingProduct ? `
        <div class="stat-item">
            <span class="stat-label">🏆 Produit le plus vendu:</span>
            <span class="stat-value">${bestSellingProduct.name} (${bestSellingProduct.totalQuantity} unités)</span>
        </div>
        ` : ''}
        
        ${mostProfitableProduct ? `
        <div class="stat-item">
            <span class="stat-label">💎 Produit le plus rentable:</span>
            <span class="stat-value">${mostProfitableProduct.name} (${mostProfitableProduct.totalRevenue.toFixed(2)}€)</span>
        </div>
        ` : ''}
        
        <div class="stat-item">
            <span class="stat-label">📦 Total d'articles vendus:</span>
            <span class="stat-value">${totalItems} unités</span>
        </div>
        
        <div class="stat-item">
            <span class="stat-label">🛍️ Nombre de produits différents:</span>
            <span class="stat-value">${data.products.length}</span>
        </div>
    </div>
    ` : `
    <div class="analysis-section">
        <p>Aucune donnée de vente disponible pour cette période.</p>
    </div>
    `}

    <div class="footer">
        Rapport généré automatiquement le ${dayjs().format('DD/MM/YYYY à HH:mm')}
    </div>
</body>
</html>
    `;
}

/**
 * Generates HTML content for sales summary report
 */
function generateSalesSummaryHTML(data: SalesSummaryData[], startDate: string, endDate: string): string {
    const formattedStartDate = dayjs(startDate).format('DD/MM/YYYY');
    const formattedEndDate = dayjs(endDate).format('DD/MM/YYYY');
    
    const totalRevenue = data.reduce((sum, item) => sum + item.total_revenue, 0);
    const totalQuantity = data.reduce((sum, item) => sum + item.total_quantity, 0);

    const productRows = data.map(item => `
        <tr>
            <td><strong>${item.item_name}</strong></td>
            <td style="text-align: right;">${item.item_price.toFixed(2)}€</td>
            <td style="text-align: center;">${item.total_quantity}</td>
            <td style="text-align: right;"><strong>${item.total_revenue.toFixed(2)}€</strong></td>
        </tr>
    `).join('');

    const top3Products = data.slice(0, 3).map((item, index) => `
        <div class="top-product">
            <div class="rank">${index + 1}</div>
            <div class="product-info">
                <h4>${item.item_name}</h4>
                <p>Quantité vendue: <strong>${item.total_quantity}</strong></p>
                <p>Recette générée: <strong>${item.total_revenue.toFixed(2)}€</strong></p>
                <p>Prix unitaire: ${item.item_price.toFixed(2)}€</p>
            </div>
        </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Résumé des Ventes</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #27ae60;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #2c3e50;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header h2 {
            color: #34495e;
            font-size: 18px;
            font-weight: normal;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .summary-card {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: left;
        }
        
        th {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            color: white;
            font-weight: bold;
            text-align: center;
        }
        
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        tr:hover {
            background-color: #e8f5e8;
        }
        
        .top-section {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #f39c12;
        }
        
        .top-section h3 {
            color: #2c3e50;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .top-product {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .rank {
            background: #f39c12;
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            margin-right: 15px;
        }
        
        .product-info h4 {
            margin: 0 0 8px 0;
            color: #2c3e50;
        }
        
        .product-info p {
            margin: 4px 0;
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            color: #7f8c8d;
            font-size: 12px;
            border-top: 1px solid #ecf0f1;
            padding-top: 20px;
        }
        
        @page {
            margin: 20mm 15mm;
            size: A4;
        }
        
        @media print {
            body {
                max-width: none;
                margin: 0;
                padding: 15px;
            }
            
            .summary-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>� Résumé des Ventes</h1>
        <h2>Période du ${formattedStartDate} au ${formattedEndDate}</h2>
    </div>

    <div class="summary-grid">
        <div class="summary-card">
            <h3>💰 Recette Totale</h3>
            <div class="value">${totalRevenue.toFixed(2)}€</div>
        </div>
        <div class="summary-card">
            <h3>📦 Articles Vendus</h3>
            <div class="value">${totalQuantity}</div>
        </div>
        <div class="summary-card">
            <h3>🛍️ Produits Différents</h3>
            <div class="value">${data.length}</div>
        </div>
        <div class="summary-card">
            <h3>📊 Recette Moyenne</h3>
            <div class="value">${data.length > 0 ? (totalRevenue / data.length).toFixed(2) : '0.00'}€</div>
        </div>
    </div>

    <h3>📋 Détail des Ventes par Produit</h3>
    <table>
        <thead>
            <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Quantité</th>
                <th>Recette</th>
            </tr>
        </thead>
        <tbody>
            ${productRows}
        </tbody>
    </table>

    ${data.length > 0 ? `
    <div class="top-section">
        <h3>🏆 Top 3 des Meilleures Ventes</h3>
        ${top3Products}
    </div>
    ` : ''}

    <div class="footer">
        Rapport généré automatiquement le ${dayjs().format('DD/MM/YYYY à HH:mm')}
    </div>
</body>
</html>
    `;
}

/**
 * Converts HTML to PDF using Electron BrowserWindow
 */
async function htmlToPdf(html: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Create a hidden window for PDF generation
        const win = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            },
            // Avoid GPU issues
            frame: false,
            titleBarStyle: 'hidden'
        });

        // Write HTML to a temporary file in the system temp directory
        const tempHtmlPath = path.join(os.tmpdir(), `cafeteria-report-${Date.now()}.html`);
        
        try {
            fs.writeFileSync(tempHtmlPath, html);
            
            win.loadFile(tempHtmlPath).then(() => {
                // Generate PDF
                win.webContents.printToPDF({
                    pageSize: 'A4',
                    printBackground: true
                    // Using default margins to avoid errors
                }).then((data) => {
                    // Save PDF
                    fs.writeFileSync(outputPath, data);
                    
                    // Cleanup
                    win.close();
                    fs.unlinkSync(tempHtmlPath);
                    
                    console.log(`PDF generated successfully: ${outputPath}`);
                    resolve();
                }).catch((error) => {
                    // Cleanup on error
                    win.close();
                    if (fs.existsSync(tempHtmlPath)) {
                        fs.unlinkSync(tempHtmlPath);
                    }
                    console.error('Error generating PDF:', error);
                    reject(error);
                });
            }).catch((error) => {
                // Cleanup on error
                win.close();
                if (fs.existsSync(tempHtmlPath)) {
                    fs.unlinkSync(tempHtmlPath);
                }
                console.error('Error loading HTML:', error);
                reject(error);
            });
        } catch (error) {
            // Cleanup on error
            win.close();
            if (fs.existsSync(tempHtmlPath)) {
                fs.unlinkSync(tempHtmlPath);
            }
            console.error('Error writing temporary HTML:', error);
            reject(error);
        }
    });
}

/**
 * Exports weekly sales report as PDF
 */
export async function exportWeeklyReportPDF(weekStartDate: string, outputPath: string): Promise<void> {
    try {
        console.log(`Generating weekly report PDF for week starting ${weekStartDate}`);
        
        // Get data
        const data = getWeeklySalesReport(weekStartDate) as WeeklyReportData;
        
        // Generate HTML
        const html = generateWeeklyReportHTML(data);
        
        // Convert HTML to PDF
        await htmlToPdf(html, outputPath);
        
        console.log(`Weekly report PDF exported successfully to ${outputPath}`);
    } catch (error) {
        console.error('Error exporting weekly report PDF:', error);
        throw error;
    }
}

/**
 * Exports sales summary report as PDF
 */
export async function exportSalesSummaryPDF(startDate: string, endDate: string, outputPath: string): Promise<void> {
    try {
        console.log(`Generating sales summary PDF from ${startDate} to ${endDate}`);
        
        // Get data
        const data = getSalesSummary(startDate, endDate) as SalesSummaryData[];
        
        // Generate HTML
        const html = generateSalesSummaryHTML(data, startDate, endDate);
        
        // Convert HTML to PDF
        await htmlToPdf(html, outputPath);
        
        console.log(`Sales summary PDF exported successfully to ${outputPath}`);
    } catch (error) {
        console.error('Error exporting sales summary PDF:', error);
        throw error;
    }
}
