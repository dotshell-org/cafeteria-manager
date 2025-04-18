import {motion} from "framer-motion";
import {t} from "i18next";
import React, {useEffect, useState} from "react";
import {LineChart, PieChart} from "@mui/x-charts";
import {FormControl, InputLabel, MenuItem, Select, TextField, CircularProgress} from "@mui/material";
import dayjs from "dayjs";
import {TimeFrame} from "../types/DailySales";
import { IpcRenderer } from "electron";

// Define the extended Window interface
declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

/*
- Evolution du nombres de commande (avec option de timeframe) -> Ligne
- Evolution de la recette (avec option de timeframe) -> Ligne
- Produits qu'on a vendus (avec option de timeframe) -> Camembert
 */

interface ChartDataPoint {
    x: string | number;
    y: number;
}

interface PieChartDataPoint {
    id: number;
    value: number;
    label: string;
}

const Stats: React.FC = () => {
    const [selectedCurve, setSelectedCurve] = useState<'revenue' | 'orders'>('revenue');
    const [timeframe, setTimeframe] = useState<TimeFrame>(TimeFrame.WEEK);
    const today = dayjs().format('YYYY-MM-DD');
    const [startDate, setStartDate] = useState<string>(today);
    const [endDate, setEndDate] = useState<string>(today);

    const [lineChartData, setLineChartData] = useState<ChartDataPoint[]>([]);
    const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
    const [isLineChartLoading, setIsLineChartLoading] = useState<boolean>(true);
    const [isPieChartLoading, setIsPieChartLoading] = useState<boolean>(true);

    // Animation variants for both entering and exiting
    const variants = {
        enter: {
            opacity: 1,
            y: 0,
            transition: {duration: 0.4, ease: "easeOut", delay: 0.3}
        },
        exit: {
            opacity: 0,
            y: 40,
            transition: {duration: 0.3, ease: "easeIn"}
        }
    };

    const rainbowColors = [
        "#7ec8ff", "#5abeff", "#36a3ff", "#1288ff", "#006dea",
        "#005bb5", "#004a9f", "#003a88", "#002971", "#00185a"
    ];

    // Fetch line chart data (revenue or order count)
    useEffect(() => {
        const fetchLineChartData = async () => {
            setIsLineChartLoading(true);
            try {
                if (selectedCurve === 'revenue') {
                    const data = await window.ipcRenderer.invoke('getRevenueData', timeframe, undefined, undefined);
                    setLineChartData(data);
                } else {
                    const data = await window.ipcRenderer.invoke('getOrderCountData', timeframe, undefined, undefined);
                    setLineChartData(data);
                }
            } catch (error) {
                console.error('Error fetching line chart data:', error);
                setLineChartData([]);
            } finally {
                setIsLineChartLoading(false);
            }
        };

        fetchLineChartData();
    }, [timeframe, selectedCurve]);

    // Fetch pie chart data (product sales)
    useEffect(() => {
        const fetchPieChartData = async () => {
            setIsPieChartLoading(true);
            try {
                const data = await window.ipcRenderer.invoke('getProductSalesData', startDate, endDate);
                setPieChartData(data);
            } catch (error) {
                console.error('Error fetching pie chart data:', error);
                setPieChartData([]);
            } finally {
                setIsPieChartLoading(false);
            }
        };

        fetchPieChartData();
    }, [startDate, endDate]);

    // Format date range for the pie chart
    const handleDateRangeChange = () => {
        // No need to manually trigger a refetch as the useEffect will handle it
        // when startDate or endDate changes
    };

    return (
        <>
            <div className="h-full flex flex-col">
                <motion.div
                    className="h-full flex flex-col p-8 pb-0 overflow-y-scroll"
                    initial={{opacity: 0, y: 40}}
                    animate="enter"
                    exit="exit"
                    variants={variants}
                >
                    <h1 className="text-3xl font-bold mt-4">📊 {t("stats")}</h1>

                    <h2 className="text-2xl font-bold mt-10">📈 {t("evolution")}</h2>
                    <div
                        className="w-full p-4 mt-4 border border-gray-200 dark:border-gray-600 rounded-lg min-h-[25rem]">
                        {isLineChartLoading ? (
                            <div className="flex justify-center items-center h-[300px]">
                                <CircularProgress />
                            </div>
                        ) : lineChartData.length === 0 ? (
                            <div className="flex justify-center items-center h-[300px] text-gray-500">
                                {t("noData")}
                            </div>
                        ) : (
                            <LineChart
                                xAxis={[{
                                    data: lineChartData.map(point => point.x),
                                    scaleType: 'point'
                                }]}
                                series={[
                                    {
                                        data: lineChartData.map(point => point.y),
                                        label: selectedCurve === 'revenue' ? t("revenue") + " (€)" : t("orderCount"),
                                        color: '#006dea'
                                    },
                                ]}
                                height={300}
                            />
                        )}
                        <div className="flex gap-4 mb-4 w-full">
                            <FormControl className="flex-1">
                                <InputLabel id="curve-type-label">{t("selectCurveType")}</InputLabel>
                                <Select
                                    labelId="curve-type-label"
                                    value={selectedCurve}
                                    label={t("selectCurveType")}
                                    onChange={(e) => setSelectedCurve(e.target.value as 'revenue' | 'orders')}
                                >
                                    <MenuItem value="revenue">{t("revenue")} (€)</MenuItem>
                                    <MenuItem value="orders">{t("orderCount")}</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl className="flex-1">
                                <InputLabel id="timeframe-label">{t("timeframe")}</InputLabel>
                                <Select
                                    labelId="timeframe-label"
                                    value={timeframe}
                                    label={t("timeframe")}
                                    onChange={(e) => setTimeframe(e.target.value as TimeFrame)}
                                >
                                    <MenuItem value={TimeFrame.DAY}>{t("day")}</MenuItem>
                                    <MenuItem value={TimeFrame.WEEK}>{t("week")}</MenuItem>
                                    <MenuItem value={TimeFrame.MONTH}>{t("month")}</MenuItem>
                                    <MenuItem value={TimeFrame.YEAR}>{t("year")}</MenuItem>
                                    <MenuItem value={TimeFrame.ALL}>{t("allTime")}</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mt-10">📦 {t("products")}</h2>
                    <div
                        className="w-full p-4 mt-4 mb-8 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden min-h-[26rem] cursor-pointer">
                        {isPieChartLoading ? (
                            <div className="flex justify-center items-center h-[300px]">
                                <CircularProgress />
                            </div>
                        ) : pieChartData.length === 0 ? (
                            <div className="flex justify-center items-center h-[300px] text-gray-500">
                                {t("noData")}
                            </div>
                        ) : (
                            <PieChart
                                margin={{right: 250}}
                                series={[{
                                    data: pieChartData,
                                    innerRadius: 1,
                                    paddingAngle: 2,
                                    cornerRadius: 4,
                                    valueFormatter: (item) => `${item.value}`,
                                    arcLabelMinAngle: 45,
                                    highlightScope: {
                                        faded: 'global',
                                        highlighted: 'item'
                                    }
                                }]}
                                height={300}
                                colors={rainbowColors}
                            />
                        )}
                        <div className="mt-4 flex gap-2">
                            <TextField
                                label={t("startDate")}
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    handleDateRangeChange();
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                className="flex-1"
                            />
                            <TextField
                                label={t("endDate")}
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    handleDateRangeChange();
                                }}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                className="flex-1"
                            />
                        </div>
                    </div>

                </motion.div>
            </div>
        </>
    )
}

export default Stats;
