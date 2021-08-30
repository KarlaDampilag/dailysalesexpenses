import * as _ from 'lodash';
import moment from 'moment';

interface SaleItemProps {
    product: any; // FIXME how to use graphql types in frontend`
    salePrice: string;
    costPrice?: string;
    quantity: number;
} // FIXME how to make universal interfaces for the whole app?

export const calculateProfitBySale = (sale: any): number => {
    const grossProfit = calculateGrossProfitBySaleItems(sale.saleItems);
    const subtotal = calculateSubtotalBySaleItems(sale.saleItems);
    let discountDeduction;
    const discountNumber = sale.discountValue ? parseFloat(sale.discountValue) : 0;
    if (sale.discountType === 'FLAT') {
        discountDeduction = discountNumber;
    } else {
        discountDeduction = subtotal * (discountNumber / 100);
    }
    const netProfit = grossProfit - discountDeduction;
    return netProfit;
}

export const calculateGrossProfitBySaleItems = (saleItems: SaleItemProps[]): number => {
    let profit: number = 0;
    _.each(saleItems, saleItem => {
        const salePrice = saleItem.salePrice ? parseFloat(saleItem.salePrice) : 0;
        const costPrice = saleItem.costPrice ? parseFloat(saleItem.costPrice) : 0;
        const singleItemProfit = parseFloat(Number(salePrice - costPrice).toFixed(3));
        const profitWithQuantity = parseFloat(Number(singleItemProfit * saleItem.quantity).toFixed(3));
        profit += profitWithQuantity;
    });
    return profit;
}

export const calculateSubtotalBySaleItems: (saleItems: SaleItemProps[]) => number = (saleItems: SaleItemProps[]) => {
    let total: number = 0;
    _.each(saleItems, saleItem => {
        const salePrice = saleItem.salePrice ? parseFloat(saleItem.salePrice) : 0;
        total += salePrice * saleItem.quantity;
    });
    return total;
}

// FIXME use proper type not any
export const calculateTotalBySale = (sale: any): number => {
    const subtotal = calculateSubtotalBySaleItems(sale.saleItems);
    let total: number = subtotal;
    let discountDeduction;
    let taxAddition;
    const discountNumber = sale.discountValue ? parseFloat(sale.discountValue) : 0;
    const taxNumber = sale.taxValue ? parseFloat(sale.taxValue) : 0;
    const shippingNumber = sale.shipping ? parseFloat(sale.shipping) : 0;
    if (sale.discountType === 'FLAT') {
        discountDeduction = discountNumber;
    } else {
        discountDeduction = subtotal * (discountNumber / 100);
    }
    total = total - discountDeduction;
    if (sale.taxType === 'FLAT') {
        taxAddition = taxNumber;
    } else {
        taxAddition = total * (taxNumber / 100);
    }
    total = total + taxAddition + shippingNumber;
    return parseFloat(Number(total).toFixed(2));
}

const calculateProductUnitsBySale = (sale: any): number => {
    let unitsTotal: number = 0;
    for (const saleItem of sale.saleItems) {
        unitsTotal += saleItem.quantity;
    }

    return unitsTotal;
}

// FOR THE DASHBOARD
export const calculateProfitByDateRange = (allSalesByUser: any, startDateUnix: number, endDateUnix: number): number => {
    const filteredSales = _.filter(allSalesByUser, sale => {
        return sale.timestamp >= startDateUnix && sale.timestamp <= endDateUnix;
    });
    let profitTotal: number = 0;
    _.forEach(filteredSales, sale => {
        const profit = calculateProfitBySale(sale);
        profitTotal += profit;
    });
    return profitTotal;
}

export const calculateExpensesByDateRange = (allExpensesByUser: any, startDateUnix: number, endDateUnix: number): number => {
    const filteredExpenses = _.filter(allExpensesByUser, expense => {
        return expense.timestamp >= startDateUnix && expense.timestamp <= endDateUnix;
    });

    let expenseTotal: number = 0;
    _.forEach(filteredExpenses, expense => {
        expenseTotal += parseFloat(expense.cost);
    });
    return expenseTotal;
}

export const calculateUnitsSoldByDateRange = (allSalesByUser: any, startDateUnix: number, endDateUnix: number): number => {
    const filteredSales = _.filter(allSalesByUser, sale => {
        return sale.timestamp >= startDateUnix && sale.timestamp <= endDateUnix;
    });
    let unitsTotal: number = 0;
    _.forEach(filteredSales, sale => {
        const profit = calculateProductUnitsBySale(sale);
        unitsTotal += profit;
    });
    return unitsTotal;
}

const getAllMonthsOfDateRange = (startDate: moment.Moment, endDate: moment.Moment): moment.Moment[] => {
    let interim: moment.Moment = startDate.clone();
    let timeValues: moment.Moment[] = [];
    while (endDate > interim || interim.format('M') === endDate.format('M')) {
        timeValues.push(moment(interim));
        interim.add(1, 'month');
    }
    return timeValues;
}

export interface SalesExpensesDataInterface {
    dateName: string;
    profit: number;
    expenses: number;
}

export const getMonthlyProfitExpensesByDateRange = (allSalesByUser: any, allExpensesByUser: any, startDate: moment.Moment, endDate: moment.Moment): SalesExpensesDataInterface[] => {
    const months = getAllMonthsOfDateRange(startDate, endDate);
    const data: SalesExpensesDataInterface[] = [];

    _.forEach(months, month => {
        const monthlyData: SalesExpensesDataInterface = {
            dateName: month.format('MM-YYYY'),
            profit: 0,
            expenses: 0
        };
        const thisStartDayUnix = month.startOf('month').unix();
        const thisLastDayUnix = month.endOf('month').unix();
        monthlyData.profit = calculateProfitByDateRange(allSalesByUser, thisStartDayUnix, thisLastDayUnix)
        monthlyData.expenses = calculateExpensesByDateRange(allExpensesByUser, thisStartDayUnix, thisLastDayUnix);
        data.push(monthlyData);
    });
    return data;
}

export interface TopSellingProductInterface {
    product: any,
    quantitySold: number,
    revenue: number
}
export const getTopSellingProductsByDateRange = (allSalesByUser: any, startDateUnix: number, endDateUnix: number, count?: number): TopSellingProductInterface[] => {
    const filteredSales = _.filter(allSalesByUser, sale => {
        return sale.timestamp >= startDateUnix && sale.timestamp <= endDateUnix;
    });
    let allSaleItemsByUser: any = [];

    for (const sale of filteredSales) {
        allSaleItemsByUser = [...allSaleItemsByUser, ...sale.saleItems];
    }

    const saleItemsByProduct = _.groupBy(allSaleItemsByUser, saleItem => {
        return saleItem.product.id;
    });

    // get revenue per product
    const data: TopSellingProductInterface[] = [];
    _.forEach(saleItemsByProduct, (saleItemByProduct: any, id: string) => {
        const entry: TopSellingProductInterface = {
            product: null,
            quantitySold: 0,
            revenue: 0
        };
        const saleItems = saleItemsByProduct[id];
        entry.product = saleItems[0].product;
        let quantityTotal = 0;
        let revenueTotal = 0;
        _.forEach(saleItems, saleItem => {
            quantityTotal += saleItem.quantity;
            const rawRevenue = saleItem.quantity * saleItem.salePrice;
            revenueTotal += (+rawRevenue.toFixed(2)); // add '+' at the beginning to return number instead of string
        });
        entry.quantitySold = quantityTotal;
        entry.revenue = revenueTotal;
        data.push(entry);
    });

    // return sorted by highest revenue
    const sortedData = _.orderBy(data, 'revenue', 'desc');
    // if count parameter was given, cut array by that count
    if (count) {
        return _.slice(sortedData, 0, count);
    } else {
        return sortedData;
    }
}

interface TopSellingCategoryInterface {
    category: any,
    quantitySold: number,
    revenue: number
}
export const getTopSellingCategoriesByDateRange = (allSalesByUser: any, startDateUnix: number, endDateUnix: number, count?: number): TopSellingCategoryInterface[] => {
    const filteredSales = _.filter(allSalesByUser, sale => {
        return sale.timestamp >= startDateUnix && sale.timestamp <= endDateUnix;
    });
    let allSaleItemsByUser: any = [];

    for (const sale of filteredSales) {
        allSaleItemsByUser = [...allSaleItemsByUser, ...sale.saleItems];
    }

    // for each sale item 
    const saleItemsByCategory: {
        [categoryName: string]: any
    } = {};

    for (const saleItem of allSaleItemsByUser) {
        const product = saleItem.product;
        const categories = product.categories;
        for (const category of categories) {
            const existingEntry = _.find(saleItemsByCategory, (entry, categoryName) => {
                return categoryName === category;
            });
            if (!existingEntry) {
                saleItemsByCategory[category] = [saleItem]
            } else {
                saleItemsByCategory[category].push(saleItem);
            }
        }
    }

    const data: TopSellingCategoryInterface[] = [];
    _.forEach(saleItemsByCategory, (saleItemByCategory, key) => {
        const entry: TopSellingCategoryInterface = {
            category: key,
            quantitySold: 0,
            revenue: 0
        };
        const saleItems = saleItemsByCategory[key];
        let quantityTotal = 0;
        let revenueTotal = 0;
        _.forEach(saleItems, saleItem => {
            quantityTotal += saleItem.quantity;
            const rawRevenue = saleItem.quantity * saleItem.salePrice;
            revenueTotal += (+rawRevenue.toFixed(2)); // add '+' at the beginning to return number instead of string
        });
        entry.quantitySold = quantityTotal;
        entry.revenue = revenueTotal;
        data.push(entry);
    });

    // return sorted by highest revenue
    const sortedData = _.orderBy(data, 'revenue', 'desc');
    // if count parameter was given, cut array by that count
    if (count) {
        return _.slice(sortedData, 0, count);
    } else {
        return sortedData;
    }
}

interface QuantityAndRevenueInterface {
    quantityTotal: number,
    revenueTotal: number
}
const getQuantityAndRevenueTotalBySale = (sale: any): QuantityAndRevenueInterface => {
    const returnObj: QuantityAndRevenueInterface = {
        quantityTotal: 0,
        revenueTotal: 0
    };
    _.forEach(sale.saleItems, saleItem => {
        returnObj.quantityTotal += saleItem.quantity;
        const thisRevenue = saleItem.quantity * saleItem.salePrice;
        returnObj.revenueTotal += thisRevenue;
    });
    return returnObj;
}

export interface TopSellingCustomerInterface {
    customer: any,
    transactions: number,
    units: number,
    revenue: number,
    profit: number
}
export const getTopCustomersByDateRange = (allSalesByUser: any, startDateUnix: number, endDateUnix: number, count?: number): TopSellingCustomerInterface[] => {
    const filteredSales = _.filter(allSalesByUser, sale => {
        return sale.timestamp >= startDateUnix && sale.timestamp <= endDateUnix;
    });
    
    const salesByCustomer = _.chain(filteredSales)
        .filter((sale: any) => {
            return sale.customer;
        })
        .groupBy((sale: any) => {
            return sale.customer.id;
        })
        .value();

    const data: TopSellingCustomerInterface[] = [];
    _.forEach(salesByCustomer, (saleByCustomer: any, id: string) => {
        const entry: TopSellingCustomerInterface = {
            customer: null,
            transactions: saleByCustomer.length,
            units: 0,
            revenue: 0,
            profit: 0
        };
        const sales = salesByCustomer[id];
        entry.customer = sales[0].customer;
        let unitsTotal = 0;
        let revenueTotal = 0;
        let profitTotal = 0;
        _.forEach(sales, sale => {
            const calculatedQuantityAndRevenuePerSale = getQuantityAndRevenueTotalBySale(sale);
            unitsTotal += calculatedQuantityAndRevenuePerSale.quantityTotal;
            const rawRevenue = calculatedQuantityAndRevenuePerSale.revenueTotal;
            revenueTotal += (+rawRevenue.toFixed(2)); // add '+' at the beginning to return number instead of string
            const calculatedProfit = calculateProfitBySale(sale);
            profitTotal += calculatedProfit;
        });
        entry.units = unitsTotal;
        entry.revenue = revenueTotal;
        entry.profit = profitTotal;
        data.push(entry);
    });

    // return sorted by highest profit
    const sortedData = _.orderBy(data, 'profit', 'desc');
    // if count parameter was given, cut array by that count
    if (count) {
        return _.slice(sortedData, 0, count);
    } else {
        return sortedData;
    }
}