import { exportWeeklyReportPDF, exportSalesSummaryPDF } from '../src/backend/export/pdfExport.js';
import dayjs from 'dayjs';

async function testPdfExport() {
    try {
        console.log('Testing PDF export functionality...');
        
        // Test weekly report
        const weekStartDate = dayjs().startOf('isoWeek').format('YYYY-MM-DD');
        const weeklyOutputPath = '/tmp/weekly-report-test.pdf';
        
        console.log(`Testing weekly report for week starting: ${weekStartDate}`);
        await exportWeeklyReportPDF(weekStartDate, weeklyOutputPath);
        console.log(`✅ Weekly report PDF generated at: ${weeklyOutputPath}`);
        
        // Test sales summary
        const startDate = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
        const endDate = dayjs().format('YYYY-MM-DD');
        const summaryOutputPath = '/tmp/sales-summary-test.pdf';
        
        console.log(`Testing sales summary from ${startDate} to ${endDate}`);
        await exportSalesSummaryPDF(startDate, endDate, summaryOutputPath);
        console.log(`✅ Sales summary PDF generated at: ${summaryOutputPath}`);
        
        console.log('🎉 All PDF exports completed successfully!');
    } catch (error) {
        console.error('❌ Error during PDF export test:', error);
        process.exit(1);
    }
}

testPdfExport();
