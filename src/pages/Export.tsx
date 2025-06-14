import React, { useState } from "react";
import { motion } from "framer-motion";
import { t } from "i18next";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
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
import isoWeek from 'dayjs/plugin/isoWeek';
import * as XLSX from 'xlsx';

// Extend dayjs with isoWeek plugin
dayjs.extend(isoWeek);

// Map i18next language codes to dayjs locale codes
function mapI18nToDatejsLocale(i18nLang: string): string {
    const localeMap: Record<string, string> = {
        'en': 'en',
        'fr': 'fr',
        'es': 'es',
        'de': 'de',
        'it': 'it',
        'pt': 'pt',
        'nl': 'nl',
        'ja': 'ja',
        'zh': 'zh',
        'ar': 'ar'
    };
    return localeMap[i18nLang] || 'en'; // Default to English if not found
}

// Define export formats
type ExportFormat = "csv" | "json" | "pdf" | "xlsx" | "ods";

// Animation variants
const variants = {
    enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut", delay: 0.3 }
    },
    exit: {
        opacity: 0,
        y: 40,
        transition: { duration: 0.3, ease: "easeIn" }
    }
};

/**
 * Function to convert object data to CSV
 */
function convertToCSV(data: any[], includeHeaders = true): string {
    if (data.length === 0) return '';

    // Extract headers from the first item
    const headers = Object.keys(data[0]);
    
    // Generate CSV rows
    const rows = data.map(item => 
        headers
            .map(header => {
                // Handle nested objects, arrays, and special characters
                let cell = item[header];
                if (cell === null || cell === undefined) return '';
                if (typeof cell === 'object') cell = JSON.stringify(cell);
                // Escape quotes and wrap in quotes if contains comma or newline
                cell = String(cell).replace(/"/g, '""');
                return /[",\n\r]/.test(cell) ? `"${cell}"` : cell;
            })
            .join(',')
    );
    
    // Add headers at the beginning if required
    return (includeHeaders ? [headers.join(',')] : []).concat(rows).join('\n');
}

/**
 * Function to download data as a file
 */
function downloadFile(data: string, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Function to download binary data as a file (for Excel/ODS files)
 */
function downloadBinaryFile(data: ArrayBuffer, filename: string, mimeType: string): void {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

/**
 * Function to create a formatted Excel/ODS workbook for weekly report
 */
function createWeeklyReportWorkbook(weeklyReportData: any, locale: string): XLSX.WorkBook {
    const wb = XLSX.utils.book_new();
    
    // Map i18n locale to dayjs locale
    const dayjsLocale = mapI18nToDatejsLocale(locale);
    
    // Create worksheet data with proper formatting
    const worksheetData: any[][] = [];
    
    // Title row - localized
    const startDate = dayjs(weeklyReportData.startDate).locale(dayjsLocale).format('DD/MM/YYYY');
    const endDate = dayjs(weeklyReportData.endDate).locale(dayjsLocale).format('DD/MM/YYYY');
    const weeklyReportTitle = t('weeklyReport').toUpperCase();
    const toText = t('to');
    worksheetData.push([`${weeklyReportTitle} - ${startDate} ${toText} ${endDate}`]);
    worksheetData.push([]); // Empty row
    
    // Header row - localized
    const productHeader = `${t('product')} (${t('price')})`;
    const headerRow = [productHeader];    // Add day headers (Monday to Sunday) using localized day names
    const weekDays = weeklyReportData.weekDays || [];
    weekDays.forEach((day: string) => {
        // Use dayjs with the current locale to get localized day names
        const dayName = dayjs(day).locale(dayjsLocale).format('dddd');
        // Capitalize first letter for all languages
        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const dateStr = dayjs(day).locale(dayjsLocale).format('DD/MM');
        headerRow.push(`${capitalizedDayName} ${dateStr}`);
    });
    
    const weeklyTotalText = t('weeklyTotal');
    const revenueText = t('revenue');
    headerRow.push(weeklyTotalText);
    headerRow.push(`${revenueText} (€)`);
    worksheetData.push(headerRow);
      // Data rows
    let totalWeeklyRevenue = 0;
    weeklyReportData.products.forEach((product: any) => {
        // Capitalize first letter of product name
        const capitalizedProductName = product.name.charAt(0).toUpperCase() + product.name.slice(1);
        const row = [`${capitalizedProductName}\n(${product.price.toFixed(2)}€)`];
          // Add daily quantities
        let weekTotal = 0;
        weekDays.forEach((day: string) => {
            const daySales = product.dailySales[day] || { quantity: 0 };
            row.push(daySales.quantity.toString());
            weekTotal += daySales.quantity;
        });
        
        // Add total quantity and revenue
        row.push(weekTotal.toString());
        row.push(product.totalRevenue.toFixed(2));
        
        totalWeeklyRevenue += product.totalRevenue;
        worksheetData.push(row);
    });      // Total row - localized
    worksheetData.push([]); // Empty row
    const totalRow = [''];
    for (let i = 1; i < headerRow.length - 2; i++) {
        totalRow.push('');
    }
    const grandTotalText = t('grandTotal').toUpperCase();
    totalRow.push(grandTotalText);
    totalRow.push(totalWeeklyRevenue.toFixed(2));
    worksheetData.push(totalRow);
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths for better readability
    const colWidths = [
        { wch: 30 }, // Product name column (wider for product name + price)
        ...weekDays.map(() => ({ wch: 12 })), // Day columns
        { wch: 15 }, // Total quantity
        { wch: 18 }  // Total revenue
    ];
    ws['!cols'] = colWidths;
    
    // Set row heights for better readability
    const rowHeights = [];
    rowHeights[0] = { hpt: 25 }; // Title row
    rowHeights[2] = { hpt: 30 }; // Header row
    for (let i = 3; i < worksheetData.length - 2; i++) {
        rowHeights[i] = { hpt: 25 }; // Data rows
    }
    rowHeights[worksheetData.length - 1] = { hpt: 25 }; // Total row
    ws['!rows'] = rowHeights;
    
    // Merge cells for title
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headerRow.length - 1 } }
    ];
    
    // Add some basic styling information (this will work better in Excel than ODS)
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!ws[titleCell]) ws[titleCell] = { t: 's', v: '' };
    ws[titleCell].s = {
        font: { bold: true, sz: 14, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: { fgColor: { rgb: 'E8F4FD' } },
        border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
        }
    };
    
    // Style header row
    for (let c = 0; c < headerRow.length; c++) {
        const headerCell = XLSX.utils.encode_cell({ r: 2, c });
        if (!ws[headerCell]) continue;
        ws[headerCell].s = {
            font: { bold: true, sz: 11, name: 'Arial' },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            fill: { fgColor: { rgb: 'D9E2F3' } },
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }
        };
    }
    
    // Style data rows with borders and alternating colors
    const dataStartRow = 3;
    const dataEndRow = worksheetData.length - 3; // Exclude empty row and total row
    
    for (let r = dataStartRow; r <= dataEndRow; r++) {
        const isEvenRow = (r - dataStartRow) % 2 === 0;
        for (let c = 0; c < headerRow.length; c++) {
            const cellRef = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellRef]) continue;
            
            ws[cellRef].s = {
                font: { sz: 10, name: 'Arial' },
                alignment: { 
                    horizontal: c === 0 ? 'left' : (c >= headerRow.length - 2 ? 'right' : 'center'),
                    vertical: 'center',
                    wrapText: c === 0 // Wrap text for product names
                },
                fill: { fgColor: { rgb: isEvenRow ? 'FFFFFF' : 'F8F9FA' } },
                border: {
                    top: { style: 'thin', color: { rgb: 'CCCCCC' } },
                    bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
                    left: { style: 'thin', color: { rgb: 'CCCCCC' } },
                    right: { style: 'thin', color: { rgb: 'CCCCCC' } }
                }
            };
        }
    }
    
    // Style total row
    const totalRowIndex = worksheetData.length - 1;
    for (let c = 0; c < headerRow.length; c++) {
        const totalCell = XLSX.utils.encode_cell({ r: totalRowIndex, c });
        if (!ws[totalCell]) continue;
        ws[totalCell].s = {
            font: { bold: true, sz: 12, name: 'Arial' },
            alignment: { horizontal: c === 0 ? 'left' : 'right', vertical: 'center' },
            fill: { fgColor: { rgb: 'FFE6CC' } },
            border: {
                top: { style: 'thick', color: { rgb: '000000' } },
                bottom: { style: 'thick', color: { rgb: '000000' } },
                left: { style: 'thick', color: { rgb: '000000' } },
                right: { style: 'thick', color: { rgb: '000000' } }
            }
        };
    }
      // Add worksheet to workbook with localized name
    const sheetName = t('weeklyReport');
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    return wb;
}

const Export: React.FC = () => {
    const { i18n } = useTranslation();
    
    // State for weekly report
    const [weekStartDate, setWeekStartDate] = useState<string>(dayjs().startOf('isoWeek').format('YYYY-MM-DD'));
    const [weeklyReportData, setWeeklyReportData] = useState<any>(null);
    const [isLoadingWeeklyReport, setIsLoadingWeeklyReport] = useState<boolean>(false);
    
    // State for date range exports
    const [startDate, setStartDate] = useState<string>(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [salesSummaryData, setSalesSummaryData] = useState<any>(null);
    const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
    
    // State for export options 
    const [currentTab, setCurrentTab] = useState<number>(0);
    const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
    const [exportStatus, setExportStatus] = useState<{ success: boolean; message: string } | null>(null);

    // Function to load a weekly sales report
    const loadWeeklySalesReport = async () => {
        setIsLoadingWeeklyReport(true);
        setExportStatus(null);
        try {
            const data = await window.ipcRenderer.invoke('getWeeklySalesReport', weekStartDate);
            setWeeklyReportData(data);
        } catch (error) {
            console.error("Error fetching weekly report:", error);
            setExportStatus({ success: false, message: t("errorLoadingWeeklyReport") });
        } finally {
            setIsLoadingWeeklyReport(false);
        }
    };

    // Function to load sales summary
    const loadSalesSummary = async () => {
        setIsLoadingSummary(true);
        setExportStatus(null);
        try {
            console.log(`Fetching sales summary for ${startDate} to ${dayjs(endDate).add(1, 'day').format('YYYY-MM-DD')}`);
            const data = await window.ipcRenderer.invoke('getSalesSummary', startDate, dayjs(endDate).add(1, 'day').format('YYYY-MM-DD'));
            console.log("Received sales summary data:", data);
            
            // Check if data is valid
            if (!data || data.length === 0) {
                setSalesSummaryData([]);
                setExportStatus({ success: false, message: t("noSalesData") });
            } else {
                setSalesSummaryData(data);
                setExportStatus({ success: true, message: `${data.length} days of sales data loaded` });
            }
        } catch (error) {
            console.error("Error fetching sales summary:", error);
            setSalesSummaryData([]);
            setExportStatus({ success: false, message: `${t("errorLoadingSalesSummary")}: ${error}` });
        } finally {
            setIsLoadingSummary(false);
        }
    };    // Function to export a weekly report
    const exportWeeklyReport = async () => {
        setExportStatus(null);
        
        if (!weeklyReportData) {
            await loadWeeklySalesReport();
            return; // If loading failed
        }
          try {
            const locale = i18n.language;
            const dayjsLocale = mapI18nToDatejsLocale(locale);
            const formattedDate = dayjs(weekStartDate).locale(dayjsLocale).format('YYYY-MM-DD');
            
            // Format weekly data for export
            let exportData: string | ArrayBuffer;
            let mimeType: string;
            let fileExtension: string;
            
            switch (exportFormat) {
                case 'csv':
                    // Transform the data into a flat structure for CSV export
                    const flattenedData = weeklyReportData.products.flatMap((product: any) => {
                        const row = {
                            name: product.name,
                            price: product.price,
                            totalQuantity: product.totalQuantity, 
                            totalRevenue: product.totalRevenue,
                        };
                          // Add daily sales data
                        weeklyReportData.weekDays.forEach((day: string) => {
                            // For each day add quantity and revenue columns
                            const daySales = product.dailySales[day] || { quantity: 0, revenue: 0 };
                            // Use a short day name (e.g., Mon, Tue) with correct locale
                            const dayLabel = dayjs(day).locale(dayjsLocale).format('ddd');
                            // @ts-ignore
                            row[`${dayLabel}_qty`] = daySales.quantity;
                            // @ts-ignore  
                            row[`${dayLabel}_rev`] = daySales.revenue;
                        });
                        
                        return row;
                    });
                    
                    exportData = convertToCSV(flattenedData);
                    mimeType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                    
                case 'json':
                    exportData = JSON.stringify({
                        reportDate: formattedDate,
                        weekStartDate: weeklyReportData.startDate,
                        weekEndDate: weeklyReportData.endDate,
                        weeklyTotal: weeklyReportData.weeklyTotal,
                        products: weeklyReportData.products
                    }, null, 2);
                    mimeType = 'application/json'; 
                    fileExtension = 'json';
                    break;
                    
                case 'xlsx':
                    const workbookXlsx = createWeeklyReportWorkbook(weeklyReportData, locale);
                    exportData = XLSX.write(workbookXlsx, { bookType: 'xlsx', type: 'array' });
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    fileExtension = 'xlsx';
                    break;
                    
                case 'ods':
                    const workbookOds = createWeeklyReportWorkbook(weeklyReportData, locale);
                    exportData = XLSX.write(workbookOds, { bookType: 'ods', type: 'array' });
                    mimeType = 'application/vnd.oasis.opendocument.spreadsheet';
                    fileExtension = 'ods';
                    break;
                    
                default:
                    setExportStatus({ success: false, message: t("formatNotSupported") });
                    return;
            }
              // Generate filename with date
            const filename = `${t('fileNames.weeklyReport')}-${formattedDate}.${fileExtension}`;
            
            // Download file based on format
            if (exportFormat === 'xlsx' || exportFormat === 'ods') {
                downloadBinaryFile(exportData as ArrayBuffer, filename, mimeType);
            } else {
                downloadFile(exportData as string, filename, mimeType);
            }
            
            setExportStatus({ success: true, message: t("exportSuccess") });
        } catch (error) {
            console.error("Error exporting data:", error);
            setExportStatus({ success: false, message: t("exportError") });
        }
    };

    // Function to export sales summary
    const exportSalesSummary = async () => {
        setExportStatus(null);
        
        try {
            // If no data or need to refresh
            if (!salesSummaryData) {
                await loadSalesSummary();
            }
            
            // Check if we have valid data after loading
            if (!salesSummaryData || salesSummaryData.length === 0) {
                setExportStatus({ success: false, message: t("noSalesData") });
                return;
            }
            
            const fromDate = dayjs(startDate).format('YYYY-MM-DD');
            const toDate = dayjs(endDate).format('YYYY-MM-DD');
            
            // Format data for export
            let exportData;
            let mimeType;
            let fileExtension;
            
            switch (exportFormat) {
                case 'csv':
                    exportData = convertToCSV(salesSummaryData);
                    mimeType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = JSON.stringify({
                        fromDate,
                        toDate,
                        data: salesSummaryData
                    }, null, 2);
                    mimeType = 'application/json';
                    fileExtension = 'json'; 
                    break;
                // Note: PDF and XLSX would need additional libraries
                default:
                    setExportStatus({ success: false, message: t("formatNotSupported") });
                    return;
            }
              // Generate filename with date range
            const filename = `${t('fileNames.salesSummary')}-${fromDate}-to-${toDate}.${fileExtension}`;
            downloadFile(exportData, filename, mimeType);
            
            setExportStatus({ success: true, message: t("exportSuccess") });
        } catch (error) {
            console.error("Error exporting data:", error);
            setExportStatus({ success: false, message: t("exportError") });
        }
    };

    // Function to export all orders
    const exportAllOrders = async () => {
        setExportStatus(null);
        
        try {
            const orders = await window.ipcRenderer.invoke('getAllOrders');
            
            if (!orders || orders.length === 0) {
                setExportStatus({ success: false, message: t("noOrdersToExport") });
                return;
            }
            
            let exportData;
            let mimeType;
            let fileExtension;
            
            switch (exportFormat) {
                case 'csv':
                    exportData = convertToCSV(orders);
                    mimeType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = JSON.stringify(orders, null, 2);
                    mimeType = 'application/json';
                    fileExtension = 'json';
                    break;
                // Note: PDF and XLSX would need additional libraries
                default:
                    setExportStatus({ success: false, message: t("formatNotSupported") });
                    return;
            }
              // Generate filename with the current date
            const currentDate = dayjs().format('YYYY-MM-DD');
            const filename = `${t('fileNames.allOrders')}-${currentDate}.${fileExtension}`;
            downloadFile(exportData, filename, mimeType);
            
            setExportStatus({ success: true, message: t("exportSuccess") });
        } catch (error) {
            console.error("Error exporting orders:", error);
            setExportStatus({ success: false, message: t("exportError") });
        }
    };

    // Function to export all products
    const exportAllProducts = async () => {
        setExportStatus(null);
        
        try {
            const products = await window.ipcRenderer.invoke('getAllProductsForExport');
            
            if (!products || products.length === 0) {
                setExportStatus({ success: false, message: t("noProductsToExport") });
                return;
            }
            
            let exportData;
            let mimeType;
            let fileExtension;
            
            switch (exportFormat) {
                case 'csv':
                    exportData = convertToCSV(products);
                    mimeType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = JSON.stringify(products, null, 2);
                    mimeType = 'application/json';
                    fileExtension = 'json';
                    break;
                // Note: PDF and XLSX would need additional libraries
                default:
                    setExportStatus({ success: false, message: t("formatNotSupported") });
                    return;
            }
              // Generate filename with the current date
            const currentDate = dayjs().format('YYYY-MM-DD');
            const filename = `${t('fileNames.productCatalog')}-${currentDate}.${fileExtension}`;
            downloadFile(exportData, filename, mimeType);
            
            setExportStatus({ success: true, message: t("exportSuccess") });
        } catch (error) {
            console.error("Error exporting products:", error);
            setExportStatus({ success: false, message: t("exportError") });
        }
    };

    return (
        <div className="h-full flex flex-col">
            <motion.div
                className="h-full flex flex-col p-8 pb-0 overflow-y-auto"
                initial={{opacity: 0, y: 40}}
                animate="enter"
                exit="exit"
                variants={variants}
            >
                <h1 className="text-3xl font-bold mt-4 mb-6">💾 {t("export")}</h1>
                
                {/* Tab Navigation */}
                <div className="mb-2">
                    <div className="flex gap-2">
                        <button
                            className={`rounded-md px-4 py-2 font-medium text-sm transition-all cursor-pointer focus:outline-0 focus-visible:outline-0 hover:border-transparent ${
                                currentTab === 0 
                                ? 'bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-500' 
                                : 'bg-gray-50 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
                            }`}
                            onClick={() => setCurrentTab(0)}
                            aria-current={currentTab === 0 ? 'page' : undefined}
                        >
                            {t("weeklyReport")} 
                        </button>
                        <button 
                            className={`rounded-md px-4 py-2 font-medium text-sm transition-all cursor-pointer focus:outline-0 focus-visible:outline-0 hover:border-transparent ${
                                currentTab === 1
                                ? 'bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-500'
                                : 'bg-gray-50 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
                            }`}
                            onClick={() => setCurrentTab(1)}
                            aria-current={currentTab === 1 ? 'page' : undefined}
                        >
                            {t("salesSummary")}
                        </button>
                        <button
                            className={`rounded-md px-4 py-2 font-medium text-sm transition-all cursor-pointer focus:outline-0 focus-visible:outline-0 hover:border-transparent ${
                                currentTab === 2
                                ? 'bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-500'
                                : 'bg-gray-50 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'  
                            }`}
                            onClick={() => setCurrentTab(2)}
                            aria-current={currentTab === 2 ? 'page' : undefined}
                        >
                            {t("allOrders")}
                        </button>
                        <button
                            className={`rounded-md px-4 py-2 font-medium text-sm transition-all cursor-pointer focus:outline-0 focus-visible:outline-0 hover:border-transparent ${
                                currentTab === 3
                                ? 'bg-gray-200 dark:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-500'
                                : 'bg-gray-50 dark:bg-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white'
                            }`}
                            onClick={() => setCurrentTab(3)}
                            aria-current={currentTab === 3 ? 'page' : undefined}
                        > 
                            {t("allProducts")}
                        </button>
                    </div>
                </div>
                
                {/* Status Messages */}
                {exportStatus && (
                    <div 
                        className={`p-3 mb-2 rounded-lg flex items-center justify-between ${
                            exportStatus.success 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }`}
                    >
                        <p>{exportStatus.message}</p>
                        <button 
                            onClick={() => setExportStatus(null)}
                            className="ml-auto bg-transparent transition-all focus:outline-none focus-visible:outline-none hover:border-transparent p-0"
                        >
                            <svg className="w-5 h-5 text-green-800" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                        </button>
                    </div>
                )}
                  {/* Export Format Selector */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="font-medium">{t("exportFormat")}:</span>
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            className={`px-3 py-1 rounded-md text-sm transition-all ${
                                exportFormat === "csv" 
                                ? "bg-blue-500 text-white dark:bg-blue-700" 
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                            }`}
                            onClick={() => setExportFormat("csv")}
                        >
                            CSV
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm transition-all ${
                                exportFormat === "json" 
                                ? "bg-blue-500 text-white dark:bg-blue-700" 
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                            }`}
                            onClick={() => setExportFormat("json")}
                        >
                            JSON
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm transition-all ${
                                exportFormat === "xlsx" 
                                ? "bg-blue-500 text-white dark:bg-blue-700" 
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                            }`}
                            onClick={() => setExportFormat("xlsx")}
                        >
                            XLSX (Excel)
                        </button>
                        <button 
                            className={`px-3 py-1 rounded-md text-sm transition-all ${
                                exportFormat === "ods" 
                                ? "bg-blue-500 text-white dark:bg-blue-700" 
                                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white"
                            }`}
                            onClick={() => setExportFormat("ods")}
                        >
                            ODS (LibreOffice)
                        </button>
                    </div>
                </div>
                
                {/* Weekly Report Tab */}
                {currentTab === 0 && (
                    <div className="relative h-full">
                        <div
                            className="absolute inset-0 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg overflow-hidden">                            <div className="p-6 mb-6 overflow-y-auto h-full">
                                <h2 className="text-xl font-bold mb-4">{t("weeklyReport")}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t("weeklyReportDescription")}
                                </p>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t("selectWeek")}
                                    </label>
                                    <input
                                        type="date"
                                        value={weekStartDate}
                                        onChange={(e) => setWeekStartDate(e.target.value)}
                                        className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    />
                                </div>
                
                                <div className="flex">
                                    <button
                                        onClick={loadWeeklySalesReport}
                                        disabled={isLoadingWeeklyReport}
                                        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all ${
                                            isLoadingWeeklyReport
                                                ? 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-wait'
                                                : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600'
                                        }`}
                                    >
                                        {isLoadingWeeklyReport && (
                                            <svg className="animate-spin h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                        strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {isLoadingWeeklyReport ? t("loading") : t("loadData")}
                                    </button>
                
                                    <button
                                        onClick={exportWeeklyReport}
                                        disabled={isLoadingWeeklyReport || !weeklyReportData}
                                        className={`ml-3 px-4 py-2 rounded-md font-medium border transition-all ${
                                            isLoadingWeeklyReport || !weeklyReportData
                                                ? 'border-gray-300 bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed'
                                                : 'border-blue-500 bg-white text-blue-500 hover:bg-blue-500 hover:text-white dark:bg-gray-800 dark:hover:bg-blue-700 dark:text-blue-400'
                                        }`}
                                    >
                                        {t("exportWeeklyReport")}
                                    </button>
                                </div>
                
                                {weeklyReportData && (
                                    <div className="mt-6 overflow-x-auto">
                                        <h3 className="text-lg font-semibold mb-2">{t("weeklyReportPreview")}</h3>
                                        <table className="min-w-full border-collapse table-auto">
                                            <thead className="bg-gray-50 dark:bg-gray-800">
                                            <tr>
                                                <th className="border px-4 py-2 text-left  dark:border-gray-600">{t("product")}</th>
                                                <th className="border px-4 py-2 text-right dark:border-gray-600">{t("price")}</th>
                                                <th className="border px-4 py-2 text-right dark:border-gray-600">{t("totalQuantity")}</th>
                                                <th className="border px-4 py-2 text-right dark:border-gray-600">{t("totalRevenue")}</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {weeklyReportData.products && weeklyReportData.products.map((product: any, index: number) => (
                                                <tr key={index}
                                                    className="bg-white dark:bg-gray-700">
                                                    <td className="border px-4 py-2 dark:border-gray-600">{product.name}</td>
                                                    <td className="border px-4 py-2 text-right dark:border-gray-600">€{product.price.toFixed(2)}</td>
                                                    <td className="border px-4 py-2 text-right dark:border-gray-600">{product.totalQuantity}</td>
                                                    <td className="border px-4 py-2 text-right dark:border-gray-600">€{product.totalRevenue.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-50 dark:bg-gray-800 font-semibold">
                                                <td colSpan={3}
                                                    className="border px-4 py-2 text-right dark:border-gray-600">{t("weeklyTotal")}:
                                                </td>
                                                <td className="border px-4 py-2 text-right dark:border-gray-600">€{weeklyReportData.weeklyTotal?.toFixed(2)}</td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sales Summary Tab */}
                {currentTab === 1 && (
                    <div className="relative h-full">
                        <div
                            className="absolute inset-0 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg overflow-hidden">
                            <div className="p-6 mb-6 overflow-y-auto h-full">
                                <h2 className="text-xl font-bold mb-4">{t("salesSummary")}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t("salesSummaryDescription")}
                                </p>
                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t("startDate")}
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            {t("endDate")}
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                
                                <div className="flex gap-4">
                                    <button
                                        onClick={loadSalesSummary}
                                        disabled={isLoadingSummary}
                                        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-all ${
                                            isLoadingSummary
                                                ? 'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400 cursor-wait'
                                                : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600'
                                        }`}
                                    >
                                        {isLoadingSummary ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-gray-200 dark:text-gray-500"
                                                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                            strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {t("loading")}
                                            </>
                                        ) : (
                                            t("loadData")
                                        )}
                                    </button>
                
                                    <button
                                        onClick={exportSalesSummary}
                                        disabled={isLoadingSummary || !salesSummaryData}
                                        className={`px-4 py-2 rounded-md font-medium border transition-all ${
                                            isLoadingSummary || !salesSummaryData
                                                ? 'border-gray-300 bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700 cursor-not-allowed'
                                                : 'border-blue-500 bg-white text-blue-500 hover:bg-blue-500 hover:text-white dark:bg-gray-800 dark:hover:bg-blue-700 dark:text-blue-400'
                                        }`}
                                    >
                                        {t("exportSalesSummary")}
                                    </button>
                                </div>
                
                                <div className="mt-6 overflow-x-auto">
                                    <h3 className="text-lg font-semibold mb-2">{t("salesSummaryPreview")}</h3>
                                    
                                    {isLoadingSummary ? (
                                        <div className="py-12 text-center">
                                            <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mb-2"></div>
                                            <p className="text-gray-500 dark:text-gray-400">{t("loading")}</p>
                                        </div>
                                    ) : salesSummaryData ? (
                                        salesSummaryData.length > 0 ? (
                                            <>
                                                <table className="min-w-full border-collapse table-auto">
                                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="border px-4 py-2 text-left dark:border-gray-600">{t("product")}</th>
                                                        <th className="border px-4 py-2 text-right dark:border-gray-600">{t("price")}</th>
                                                        <th className="border px-4 py-2 text-right dark:border-gray-600">{t("totalQuantity")}</th>
                                                        <th className="border px-4 py-2 text-right dark:border-gray-600">{t("totalRevenue")}</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {salesSummaryData.map((item: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="border px-4 py-2 dark:border-gray-600">{item.item_name}</td>
                                                            <td className="border px-4 py-2 text-right dark:border-gray-600">€{Number(item.item_price).toFixed(2)}</td>
                                                            <td className="border px-4 py-2 text-right dark:border-gray-600">{item.total_quantity}</td>
                                                            <td className="border px-4 py-2 text-right dark:border-gray-600">€{Number(item.total_revenue).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                                                            <td className="border px-4 py-2 text-right dark:border-gray-600" colSpan={3}>{t("total")}:</td>
                                                            <td className="border px-4 py-2 text-right dark:border-gray-600">
                                                                €{salesSummaryData.reduce((sum: any, item: { total_revenue: any; }) => sum + (Number(item.total_revenue) || 0), 0).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </>
                                        ) : (
                                            <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
                                                {t("noSalesData")}
                                            </div>
                                        )
                                    ) : (
                                        <div className="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-md">
                                            {t("selectDateRange")}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Orders Tab */}
                {currentTab === 2 && (
                    <div className="relative h-full">
                        <div
                            className="absolute inset-0 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg overflow-hidden">
                            <div className="p-6 mb-6 overflow-y-auto h-full">
                                <h2 className="text-xl font-bold mb-4">{t("allOrders")}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t("allOrdersDescription")}
                                </p>
                
                                <button
                                    onClick={exportAllOrders}
                                    className="px-4 py-2 rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                                >
                                    {t("exportAllOrders")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* All Products Tab */}
                {currentTab === 3 && (
                    <div className="relative h-full">
                        <div
                            className="absolute inset-0 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg overflow-hidden">
                            <div className="p-6 mb-6 overflow-y-auto h-full">
                                <h2 className="text-xl font-bold mb-4">{t("allProducts")}</h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t("allProductsDescription")}
                                </p>
                
                                <button
                                    onClick={exportAllProducts}
                                    className="px-4 py-2 rounded-md font-medium bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                                >
                                    {t("exportAllProducts")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default Export;
