import { BrowserWindow } from 'electron';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/it';
import 'dayjs/locale/pt';
import 'dayjs/locale/nl';
import 'dayjs/locale/ja';
import 'dayjs/locale/zh';
import 'dayjs/locale/ar';
import localizedFormat from 'dayjs/plugin/localizedFormat.js';
import { getWeeklySalesReport, getSalesSummary } from './exportData.js';
import path from 'path';
import fs from 'fs';
import os from 'os';

dayjs.extend(localizedFormat);

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
    // Traductions pour tout le contenu du PDF
    const translations: Record<string, any> = {
        fr: {
            title: 'Rapport Hebdomadaire de Ventes',
            period: 'Période',
            totalRevenue: 'Recette totale de la semaine',
            salesDetail: 'Détail des Ventes par Produit',
            product: 'Produit',
            total: 'Total',
            revenue: 'Recette',
            performance: 'Analyse des Performances',
            bestSelling: 'Produit le plus vendu',
            mostProfitable: 'Produit le plus rentable',
            totalItems: "Total d'articles vendus",
            productCount: 'Nombre de produits différents',
            noData: 'Aucune donnée de vente disponible pour cette période.',
            generated: 'Rapport généré automatiquement le',
            at: 'à',
            units: 'unités',
        },
        en: {
            title: 'Weekly Sales Report',
            period: 'Period',
            totalRevenue: 'Total revenue for the week',
            salesDetail: 'Sales Details by Product',
            product: 'Product',
            total: 'Total',
            revenue: 'Revenue',
            performance: 'Performance Analysis',
            bestSelling: 'Best-selling product',
            mostProfitable: 'Most profitable product',
            totalItems: 'Total items sold',
            productCount: 'Number of different products',
            noData: 'No sales data available for this period.',
            generated: 'Report generated automatically on',
            at: 'at',
            units: 'units',
        },
        es: {
            title: 'Informe semanal de ventas',
            period: 'Período',
            totalRevenue: 'Ingresos totales de la semana',
            salesDetail: 'Detalle de ventas por producto',
            product: 'Producto',
            total: 'Total',
            revenue: 'Ingresos',
            performance: 'Análisis de rendimiento',
            bestSelling: 'Producto más vendido',
            mostProfitable: 'Producto más rentable',
            totalItems: 'Total de artículos vendidos',
            productCount: 'Número de productos diferentes',
            noData: 'No hay datos de ventas disponibles para este período.',
            generated: 'Informe generado automáticamente el',
            at: 'a las',
            units: 'unidades',
        },
        de: {
            title: 'Wöchentlicher Verkaufsbericht',
            period: 'Zeitraum',
            totalRevenue: 'Gesamteinnahmen der Woche',
            salesDetail: 'Verkaufsdetails nach Produkt',
            product: 'Produkt',
            total: 'Gesamt',
            revenue: 'Einnahmen',
            performance: 'Leistungsanalyse',
            bestSelling: 'Meistverkauftes Produkt',
            mostProfitable: 'Profitabelstes Produkt',
            totalItems: 'Verkaufte Artikel insgesamt',
            productCount: 'Anzahl verschiedener Produkte',
            noData: 'Für diesen Zeitraum sind keine Verkaufsdaten verfügbar.',
            generated: 'Bericht automatisch erstellt am',
            at: 'um',
            units: 'Stück',
        },
        it: {
            title: 'Rapporto settimanale delle vendite',
            period: 'Periodo',
            totalRevenue: 'Ricavi totali della settimana',
            salesDetail: 'Dettaglio vendite per prodotto',
            product: 'Prodotto',
            total: 'Totale',
            revenue: 'Ricavi',
            performance: 'Analisi delle prestazioni',
            bestSelling: 'Prodotto più venduto',
            mostProfitable: 'Prodotto più redditizio',
            totalItems: 'Totale articoli venduti',
            productCount: 'Numero di prodotti diversi',
            noData: 'Nessun dato di vendita disponibile per questo periodo.',
            generated: 'Rapporto generato automaticamente il',
            at: 'alle',
            units: 'unità',
        },
        pt: {
            title: 'Relatório semanal de vendas',
            period: 'Período',
            totalRevenue: 'Receita total da semana',
            salesDetail: 'Detalhe de vendas por produto',
            product: 'Produto',
            total: 'Total',
            revenue: 'Receita',
            performance: 'Análise de desempenho',
            bestSelling: 'Produto mais vendido',
            mostProfitable: 'Produto mais lucrativo',
            totalItems: 'Total de itens vendidos',
            productCount: 'Número de produtos diferentes',
            noData: 'Nenhum dado de venda disponível para este período.',
            generated: 'Relatório gerado automaticamente em',
            at: 'às',
            units: 'unidades',
        },
        nl: {
            title: 'Wekelijks verkooprapport',
            period: 'Periode',
            totalRevenue: 'Totale omzet van de week',
            salesDetail: 'Verkoopdetails per product',
            product: 'Product',
            total: 'Totaal',
            revenue: 'Omzet',
            performance: 'Prestatieanalyse',
            bestSelling: 'Best verkochte product',
            mostProfitable: 'Meest winstgevende product',
            totalItems: 'Totaal verkochte artikelen',
            productCount: 'Aantal verschillende producten',
            noData: 'Geen verkoopgegevens beschikbaar voor deze periode.',
            generated: 'Rapport automatisch gegenereerd op',
            at: 'om',
            units: 'stuks',
        },
        ja: {
            title: '週間売上レポート',
            period: '期間',
            totalRevenue: '今週の総売上',
            salesDetail: '商品別売上詳細',
            product: '商品',
            total: '合計',
            revenue: '売上',
            performance: 'パフォーマンス分析',
            bestSelling: '最も売れた商品',
            mostProfitable: '最も利益の高い商品',
            totalItems: '販売総数',
            productCount: '異なる商品の数',
            noData: 'この期間の販売データはありません。',
            generated: '自動生成レポート',
            at: '',
            units: '個',
        },
        zh: {
            title: '每周销售报告',
            period: '期间',
            totalRevenue: '本周总收入',
            salesDetail: '按产品销售明细',
            product: '产品',
            total: '总计',
            revenue: '收入',
            performance: '业绩分析',
            bestSelling: '最畅销产品',
            mostProfitable: '最赚钱的产品',
            totalItems: '售出总数',
            productCount: '不同产品数量',
            noData: '本期无销售数据。',
            generated: '报告自动生成于',
            at: '',
            units: '件',
        },
        ar: {
            title: 'تقرير المبيعات الأسبوعي',
            period: 'الفترة',
            totalRevenue: 'إجمالي الإيرادات للأسبوع',
            salesDetail: 'تفاصيل المبيعات حسب المنتج',
            product: 'المنتج',
            total: 'الإجمالي',
            revenue: 'الإيرادات',
            performance: 'تحليل الأداء',
            bestSelling: 'الأكثر مبيعًا',
            mostProfitable: 'الأكثر ربحية',
            totalItems: 'إجمالي العناصر المباعة',
            productCount: 'عدد المنتجات المختلفة',
            noData: 'لا توجد بيانات مبيعات متاحة لهذه الفترة.',
            generated: 'تم إنشاء التقرير تلقائيًا في',
            at: '',
            units: 'وحدة',
        },
    };
    const t = translations[locale] || translations['en'];
    const startDate = dayjs(data.startDate).format('DD/MM/YYYY');
    const endDate = dayjs(data.endDate).format('DD/MM/YYYY');
    
    // Generate day headers
    const dayHeaders = data.weekDays.map(day => {
        const dayName = dayjs(day).locale(locale).format('ddd');
        const date = dayjs(day).locale(locale).format('DD/MM');
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
<html lang="${locale}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport Hebdomadaire de Ventes</title>
    <!-- Intégration police Aileron -->
    <style>
        @font-face {
            font-family: 'Aileron';
            src: url('file://${process.cwd()}/src/assets/font/Aileron-Regular.otf') format('opentype');
            font-weight: 400;
            font-style: normal;
        }
        @font-face {
            font-family: 'Aileron';
            src: url('file://${process.cwd()}/src/assets/font/Aileron-Bold.otf') format('opentype');
            font-weight: 700;
            font-style: normal;
        }
        body {
            font-family: 'Aileron', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #fff;
            max-width: 900px;
            margin: 0 auto;
            padding: 32px 24px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 4px solid #3b82f6;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #0f172a;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .header h2 {
            color: #334155;
            font-size: 1.1rem;
            font-weight: 400;
        }
        
        .summary-section {
            background: #fff;
            color: #1e293b;
            padding: 24px;
            border-radius: 1rem;
            margin-bottom: 32px;
            text-align: center;
            box-shadow: 0 4px 24px rgba(59,130,246,0.08);
            border: 1.5px solid #e5e7eb;
        }
        
        .total-revenue {
            font-size: 2.2rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 24px 0;
            font-size: 1rem;
            background: white;
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }
        
        th, td {
            border: 1px solid #e5e7eb;
            padding: 10px 8px;
        }
        
        th {
            background: #f1f5f9;
            color: #0f172a;
            font-weight: 700;
        }
        
        tr:nth-child(even) {
            background: #f8fafc;
        }
        
        tr:hover {
            background: #e0e7ef;
        }
        
        .highlight {
            background: #dbeafe;
            color: #1d4ed8;
            font-weight: bold;
            border-radius: 0.5rem;
            padding: 2px 8px;
        }
        
        .analysis-section {
            background: #fff;
            border: 1.5px solid #e5e7eb;
            border-radius: 1rem;
            margin-top: 32px;
            padding: 24px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.04);
            text-align: center;
        }
        
        .analysis-section h3 {
            color: #2563eb;
            font-size: 1.2rem;
            margin-bottom: 18px;
            text-align: center;
        }
        
        .stat-item {
            margin-bottom: 18px;
        }
        
        .stat-label {
            font-weight: 600;
            color: #334155;
            display: block;
            font-size: 1.05rem;
            margin-bottom: 2px;
        }
        
        .stat-value {
            font-weight: 500;
            color: #1e293b;
            display: block;
            font-size: 1.08rem;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #64748b;
            font-size: 0.95rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${t.title}</h1>
        <h2>${t.period} : ${startDate} – ${endDate}</h2>
    </div>

    <div class="summary-section">
        <div class="total-revenue">${data.weeklyTotal.toFixed(2)}€</div>
        <div>${t.totalRevenue}</div>
    </div>

    <h3>${t.salesDetail}</h3>
    <table>
        <thead>
            <tr>
                <th>${t.product}</th>
                ${dayHeaders}
                <th>${t.total}</th>
                <th>${t.revenue}</th>
            </tr>
        </thead>
        <tbody>
            ${productRows}
        </tbody>
    </table>

    ${data.products.length > 0 ? `
    <div class="analysis-section">
        <h3>${t.performance}</h3>
        ${bestSellingProduct ? `
        <div class="stat-item">
            <span class="stat-label">${t.bestSelling}</span>
            <span class="stat-value">${bestSellingProduct.name} (${bestSellingProduct.totalQuantity} ${t.units}, ${bestSellingProduct.totalRevenue.toFixed(2)}€)</span>
        </div>
        ` : ''}
        ${mostProfitableProduct && mostProfitableProduct.name !== bestSellingProduct?.name ? `
        <div class="stat-item">
            <span class="stat-label">${t.mostProfitable}</span>
            <span class="stat-value">${mostProfitableProduct.name} (${mostProfitableProduct.totalRevenue.toFixed(2)}€, ${mostProfitableProduct.totalQuantity} ${t.units})</span>
        </div>
        ` : ''}
        <div class="stat-item">
            <span class="stat-label">${t.totalItems}</span>
            <span class="stat-value">${totalItems} ${t.units}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">${t.productCount}</span>
            <span class="stat-value">${data.products.length}</span>
        </div>
    </div>
    ` : `
    <div class="analysis-section">
        <p>${t.noData}</p>
    </div>
    `}

    <div class="footer">
        ${t.generated} ${dayjs().locale(locale).format('L')} ${t.at} ${dayjs().locale(locale).format('LT')}
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
        <h1>Résumé des Ventes</h1>
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
export async function exportWeeklyReportPDF(weekStartDate: string, outputPath: string, locale: string = 'fr'): Promise<void> {
    try {
        console.log(`Generating weekly report PDF for week starting ${weekStartDate} (locale: ${locale})`);
        
        // Get data
        const data = getWeeklySalesReport(weekStartDate) as WeeklyReportData;
        
        // Generate HTML
        const html = generateWeeklyReportHTML(data, locale);
        
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
