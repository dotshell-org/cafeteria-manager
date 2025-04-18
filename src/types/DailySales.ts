/**
 * Types for statistics data used in the Stats page
 */

/**
 * Represents daily sales data for charts
 */
export interface DailySales {
  date: string;
  revenue: number;
  orderCount: number;
}

/**
 * Represents product sales data for pie chart
 */
export interface ProductSales {
  name: string;
  value: number;
}

/**
 * Timeframe options for filtering statistics
 */
export enum TimeFrame {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
  ALL = 'all'
}