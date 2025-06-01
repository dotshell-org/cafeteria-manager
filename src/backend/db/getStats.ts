import {db} from './config.js';
import dayjs from 'dayjs';
import {TimeFrame} from '../../types/DailySales.js';
import utc from 'dayjs/plugin/utc.js'; // Import UTC plugin
import isBetween from 'dayjs/plugin/isBetween.js'; // Import isBetween plugin

dayjs.extend(utc); // Extend dayjs with UTC plugin
dayjs.extend(isBetween); // Extend dayjs with isBetween plugin


interface ChartDataPoint {
    x: string | number;
    y: number;
}
interface PieChartDataPoint {
    id: number;
    value: number;
    label: string;
}

// Helper function to generate date/time ranges and labels
function generateTimeLabels(timeframe: TimeFrame): string[] {
    const now = dayjs();
    const labels: string[] = [];

    switch (timeframe) {
        case TimeFrame.DAY:
            // Last 24 hours, ending with the current hour
            for (let i = 0; i < 24; i++) {
                labels.push(now.subtract(23 - i, 'hour').format('YYYY-MM-DD HH:00'));
            }
            break;
        case TimeFrame.WEEK:
            // Last 7 days, ending today
            for (let i = 0; i < 7; i++) {
                labels.push(now.subtract(6 - i, 'day').format('YYYY-MM-DD'));
            }
            break;
        case TimeFrame.MONTH:
            // Last 30 days, grouped into 5 periods (approx 6 days each)
            // Labels represent the end date of each 6-day period
            for (let i = 0; i < 5; i++) {
                const periodEndDate = now.subtract((4 - i) * 6, 'day');
                const periodStartDate = periodEndDate.subtract(5, 'day');
                // Using end date as label for simplicity, could format as range
                labels.push(`${periodStartDate.format('MM-DD')} - ${periodEndDate.format('MM-DD')}`);
            }
            break;
        case TimeFrame.YEAR:
            // Last 12 months, ending with the current month
            for (let i = 0; i < 12; i++) {
                labels.push(now.subtract(11 - i, 'month').format('YYYY-MM'));
            }
            break;
        // For ALL, labels are generated dynamically based on data range
        default:
            break;
    }
    return labels;
}


// Helper function to process raw data based on timeframe requirements
function processDataForTimeframe(rawData: { date: string; value: number }[], timeframe: TimeFrame): ChartDataPoint[] {
    const now = dayjs();
    const result: ChartDataPoint[] = [];

    if (!rawData || rawData.length === 0) {
        // If no data, return empty points for expected labels (except for ALL)
        const labels = generateTimeLabels(timeframe);
        return labels.map(label => ({ x: label, y: 0 }));
    }

    // Convert dates to dayjs objects for easier comparison
    const processedData = rawData.map(item => ({
        date: dayjs(item.date), // Assuming date strings are parseable by dayjs
        value: item.value
    }));

    switch (timeframe) {
        case TimeFrame.DAY: {
            const labels = generateTimeLabels(timeframe);
            const hourlyData = new Map<string, number>();
            labels.forEach(label => hourlyData.set(label, 0)); // Initialize with 0

            // Aggregate data by hour (using the start of the hour as key)
            processedData.forEach(item => {
                // Check if date is within the last 24 hours relative to now
                if (item.date.isAfter(now.subtract(24, 'hour'))) {
                    const hourKey = item.date.startOf('hour').format('YYYY-MM-DD HH:00');
                    if (hourlyData.has(hourKey)) {
                        hourlyData.set(hourKey, (hourlyData.get(hourKey) || 0) + item.value);
                    }
                }
            });

            // Ensure exactly 24 points, ordered correctly
            labels.forEach(label => {
                result.push({ x: dayjs(label).format('HH:00'), y: hourlyData.get(label) || 0 });
            });
            break;
        }
        case TimeFrame.WEEK: {
            const labels = generateTimeLabels(timeframe);
            const dailyData = new Map<string, number>();
            labels.forEach(label => dailyData.set(label, 0)); // Initialize with 0

            // Aggregate data by day
            processedData.forEach(item => {
                // Check if date is within the last 7 days relative to now
                if (item.date.isAfter(now.subtract(7, 'day'))) {
                    const dayKey = item.date.format('YYYY-MM-DD');
                    if (dailyData.has(dayKey)) {
                        dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + item.value);
                    }
                }
            });

            // Ensure exactly 7 points, ordered correctly
            labels.forEach(label => {
                result.push({ x: dayjs(label).format('ddd DD'), y: dailyData.get(label) || 0 }); // Format as 'Mon 01'
            });
            break;
        }
        case TimeFrame.MONTH: {
            const labels = generateTimeLabels(timeframe);
            const periodData: number[] = Array(5).fill(0);
            const periodEndDates: dayjs.Dayjs[] = [];
            // Calculate the end date for each of the 5 periods
            for (let i = 0; i < 5; i++) {
                periodEndDates.push(now.subtract((4 - i) * 6, 'day'));
            }

            // Aggregate data into the 5 periods
            processedData.forEach(item => {
                // Find which period the item falls into
                for (let i = 0; i < 5; i++) {
                    const periodEnd = periodEndDates[i];
                    const periodStart = periodEnd.subtract(5, 'day'); // 6-day period
                    // Check if the item's date is within the period (inclusive start, exclusive end might be better)
                    if (item.date.isBetween(periodStart.subtract(1, 'millisecond'), periodEnd.add(1, 'millisecond'))) {
                        periodData[i] += item.value;
                        break; // Assign to the first matching period
                    }
                }
            });

            labels.forEach((label, index) => {
                result.push({ x: label, y: periodData[index] });
            });
            break;
        }
        case TimeFrame.YEAR: {
            const labels = generateTimeLabels(timeframe);
            const monthlyData = new Map<string, number>();
            labels.forEach(label => monthlyData.set(label, 0)); // Initialize with 0

            // Aggregate data by month
            processedData.forEach(item => {
                // Check if date is within the last 12 months relative to now
                if (item.date.isAfter(now.subtract(12, 'month'))) {
                    const monthKey = item.date.format('YYYY-MM');
                    if (monthlyData.has(monthKey)) {
                        monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + item.value);
                    }
                }
            });

            // Ensure exactly 12 points, ordered correctly
            labels.forEach(label => {
                result.push({ x: dayjs(label + '-01').format('MMM YYYY'), y: monthlyData.get(label) || 0 }); // Format as 'Jan 2024'
            });
            break;
        }
        case TimeFrame.ALL: {
            if (processedData.length === 0) return []; // No data, return empty

            // Find the earliest and latest date in the dataset
            const sortedData = processedData.sort((a, b) => a.date.valueOf() - b.date.valueOf());
            const firstDate = sortedData[0].date;
             // Use now as the end boundary
            const totalDurationDays = now.diff(firstDate, 'day');

            if (totalDurationDays <= 0 || sortedData.length < 10) {
                // If duration is too short or not enough data points, return daily points
                // Or handle as a special case - here returning daily aggregate
                const dailyData = new Map<string, number>();
                sortedData.forEach(item => {
                    const dayKey = item.date.format('YYYY-MM-DD');
                    dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + item.value);
                });
                return Array.from(dailyData.entries()).map(([date, value]) => ({ x: date, y: value }));
            }

            const intervalDays = Math.ceil(totalDurationDays / 10); // Divide total duration by 10
            const intervalData: number[] = Array(10).fill(0);
            const intervalLabels: string[] = [];

            // Aggregate data into 10 intervals
            for (let i = 0; i < 10; i++) {
                const intervalStartDate = firstDate.add(i * intervalDays, 'day');
                const intervalEndDate = firstDate.add((i + 1) * intervalDays, 'day');
                intervalLabels.push(intervalStartDate.format('YYYY-MM-DD')); // Label with start date

                sortedData.forEach(item => {
                    // Check if the item's date falls within the current interval
                    // Use isBetween (inclusive start, exclusive end usually)
                    if (item.date.isBetween(intervalStartDate.subtract(1,'ms'), intervalEndDate, null, '[)')) {
                        intervalData[i] += item.value;
                    }
                });

                // Special handling for the last interval to include the very last date
                if (i === 9) {
                    sortedData.forEach(item => {
                        if (item.date.isSame(intervalEndDate, 'day')) { // Include end date only for last interval if needed
                            intervalData[i] += item.value;
                        }
                    });
                }
            }

            intervalLabels.forEach((label, index) => {
                result.push({ x: label, y: intervalData[index] });
            });
            break;
        }
    }

    return result;
}


/**
 * Get revenue data for a specific timeframe
 */
export function getRevenueData(timeframe: TimeFrame): ChartDataPoint[] {
    let query: string;
    let rawResult: { date: string; value: number }[];

    // For timeframes other than ALL, fetch data grouped by the smallest necessary unit (day or hour)
    // Processing into final buckets (week, month, year periods) happens in processDataForTimeframe
    switch (timeframe) {
        case TimeFrame.DAY:
            // Fetch last ~25 hours to be safe with timezones/rounding, group by hour
            const startDay = dayjs().subtract(25, 'hour').toISOString(); // Use ISO string for query
            const endDay = dayjs().toISOString();
            query = `
                SELECT
                    strftime('%Y-%m-%d %H:00:00', date) as date_hour,
                    SUM(total_price) as value
                FROM orders
                WHERE date >= ? AND date <= ?
                GROUP BY date_hour
                ORDER BY date_hour ASC
            `;
            // rawResult needs alias mapping
            const dayRaw = db.prepare(query).all(startDay, endDay);
            rawResult = dayRaw.map((row: any) => ({ date: row.date_hour, value: row.value || 0 }));
            break;
        case TimeFrame.WEEK:
        case TimeFrame.MONTH: // Fetch daily data for Month and aggregate later
            const startWeekMonth = dayjs().subtract(timeframe === TimeFrame.WEEK ? 7 : 30, 'day').startOf('day').toISOString();
            const endWeekMonth = dayjs().endOf('day').toISOString();
            query = `
                SELECT
                    strftime('%Y-%m-%d', date) as date_day,
                    SUM(total_price) as value
                FROM orders
                WHERE date >= ? AND date <= ?
                GROUP BY date_day
                ORDER BY date_day ASC
            `;
            const weekMonthRaw = db.prepare(query).all(startWeekMonth, endWeekMonth);
            rawResult = weekMonthRaw.map((row: any) => ({ date: row.date_day, value: row.value || 0 }));
            break;
        case TimeFrame.YEAR:
            const startYear = dayjs().subtract(12, 'month').startOf('month').toISOString();
            const endYear = dayjs().endOf('day').toISOString(); // Include all of today
            query = `
                 SELECT
                     strftime('%Y-%m', date) as date_month,
                     SUM(total_price) as value
                 FROM orders
                 WHERE date >= ? AND date <= ?
                 GROUP BY date_month
                 ORDER BY date_month ASC
             `;
            const yearRaw = db.prepare(query).all(startYear, endYear);
            // Map to a common structure, using first day of month for consistency
            rawResult = yearRaw.map((row: any) => ({ date: `${row.date_month}-01`, value: row.value || 0 }));
            break;
        case TimeFrame.ALL:
        default: // Default or ALL: Fetch all data grouped by day
            query = `
                 SELECT
                     strftime('%Y-%m-%d', date) as date_day,
                     SUM(total_price) as value
                 FROM orders
                 GROUP BY date_day
                 ORDER BY date_day ASC
             `;
            const allRaw = db.prepare(query).all();
            rawResult = allRaw.map((row: any) => ({ date: row.date_day, value: row.value || 0 }));
            break;
    }

    // Process the raw SQL result based on the specific timeframe requirements
    return processDataForTimeframe(rawResult, timeframe);
}


/**
 * Get order count data for a specific timeframe
 */
export function getOrderCountData(timeframe: TimeFrame): ChartDataPoint[] {
    let query: string;
    let rawResult: { date: string; value: number }[];

    // Similar logic as getRevenueData, but use COUNT(*)
    switch (timeframe) {
        case TimeFrame.DAY:
            const startDay = dayjs().subtract(25, 'hour').toISOString();
            const endDay = dayjs().toISOString();
            query = `
                 SELECT
                     strftime('%Y-%m-%d %H:00:00', date) as date_hour,
                     COUNT(*) as value
                 FROM orders
                 WHERE date >= ? AND date <= ?
                 GROUP BY date_hour
                 ORDER BY date_hour ASC
             `;
            const dayRaw = db.prepare(query).all(startDay, endDay);
            rawResult = dayRaw.map((row: any) => ({ date: row.date_hour, value: row.value || 0 }));
            break;
        case TimeFrame.WEEK:
        case TimeFrame.MONTH:
            const startWeekMonth = dayjs().subtract(timeframe === TimeFrame.WEEK ? 7 : 30, 'day').startOf('day').toISOString();
            const endWeekMonth = dayjs().endOf('day').toISOString();
            query = `
                 SELECT
                     strftime('%Y-%m-%d', date) as date_day,
                     COUNT(*) as value
                 FROM orders
                 WHERE date >= ? AND date <= ?
                 GROUP BY date_day
                 ORDER BY date_day ASC
             `;
            const weekMonthRaw = db.prepare(query).all(startWeekMonth, endWeekMonth);
            rawResult = weekMonthRaw.map((row: any) => ({ date: row.date_day, value: row.value || 0 }));
            break;
        case TimeFrame.YEAR:
            const startYear = dayjs().subtract(12, 'month').startOf('month').toISOString();
            const endYear = dayjs().endOf('day').toISOString();
            query = `
                  SELECT
                      strftime('%Y-%m', date) as date_month,
                      COUNT(*) as value
                  FROM orders
                  WHERE date >= ? AND date <= ?
                  GROUP BY date_month
                  ORDER BY date_month ASC
              `;
            const yearRaw = db.prepare(query).all(startYear, endYear);
            rawResult = yearRaw.map((row: any) => ({ date: `${row.date_month}-01`, value: row.value || 0 }));
            break;
        case TimeFrame.ALL:
        default:
            query = `
                  SELECT
                      strftime('%Y-%m-%d', date) as date_day,
                      COUNT(*) as value
                  FROM orders
                  GROUP BY date_day
                  ORDER BY date_day ASC
              `;
            const allRaw = db.prepare(query).all();
            rawResult = allRaw.map((row: any) => ({ date: row.date_day, value: row.value || 0 }));
            break;
    }

    return processDataForTimeframe(rawResult, timeframe);
}


/**
 * Get top product sales for a date range
 */
export function getProductSalesData(startDate: string, endDate: string): PieChartDataPoint[] {
    // Ensure dates are treated as full days for the query
    const startOfDay = dayjs(startDate).startOf('day').toISOString();
    const endOfDay = dayjs(endDate).endOf('day').toISOString();


    const query = `
        SELECT
            oi.item_name,
            SUM(oi.quantity) as total_quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.date BETWEEN ? AND ?
        GROUP BY oi.item_name
        ORDER BY total_quantity DESC
        LIMIT 10
    `;

    // Use ISO strings for date range query
    const result = db.prepare(query).all(startOfDay, endOfDay);

    return result.map((row: any, index: number) => ({
        id: index,
        value: row.total_quantity || 0, // Ensure value is number
        label: row.item_name
    }));
}
