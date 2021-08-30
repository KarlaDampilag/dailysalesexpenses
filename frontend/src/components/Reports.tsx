import React from 'react';
import moment from 'moment';
import * as _ from 'lodash';
import { useQuery } from '@apollo/react-hooks';
import { DatePicker, Table, Tag, Card, Row, Col } from 'antd';
import { RightSquareTwoTone, DownSquareTwoTone } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { userContext } from './App';

import { SALES_BY_USER_QUERY } from './Sales';
import { EXPENSES_BY_USER_QUERY } from './Expenses';

import {
    calculateProfitByDateRange, calculateExpensesByDateRange, calculateUnitsSoldByDateRange, getMonthlyProfitExpensesByDateRange, getTopSellingProductsByDateRange, getTopSellingCategoriesByDateRange, getTopCustomersByDateRange,
    TopSellingCustomerInterface
} from '../services/main';
import { sortByProperty, formatNumber } from './utils';
import withWindowDimension from './withWindowDimenstions';

interface Properties {
    windowWidth: number;
}
const Reports = (props: Properties) => {
    const { data: salesData, } = useQuery(SALES_BY_USER_QUERY);
    const sales = salesData ? salesData.salesByUser : null;

    const { data: expensesData } = useQuery(EXPENSES_BY_USER_QUERY);
    const expenses = expensesData ? expensesData.expensesByUser : null;


    const [startDate, setStartDate] = React.useState<moment.Moment>(moment().startOf('year'));
    const [endDate, setEndDate] = React.useState<moment.Moment>(moment().endOf('month'));

    const datePickerFormat = 'DD MMMM YYYY';

    const topCustomersExpandableConfig = React.useMemo(() => {
        if (props.windowWidth >= 656) {
            return undefined;
        } else {
            return {
                expandedRowRender: (record: any) => <TopCustomerRowDetails rowData={record} />,
                expandIcon: (props: any) => {
                    const { expanded, onExpand, record } = props;
                    return (
                        expanded ? <DownSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-655' />
                            : <RightSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-655' />
                    )
                }
            }
        }
    }, [props.windowWidth]);
    interface TopCustomerRowDetailsPropsInterface {
        rowData: TopSellingCustomerInterface;
    }
    const TopCustomerRowDetails = (rowDetailsProps: TopCustomerRowDetailsPropsInterface) => {
        const { transactions, units } = rowDetailsProps.rowData;
        return (
            <div className='top-customer-detail-mobile'>
                <div>
                    <div className='summary-row'>
                        <span>Transactions:</span> <span>{formatNumber(transactions)}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Units Bought:</span> <span>{formatNumber(units)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='reports-wrapper'>
            <userContext.Consumer>
                {value => {
                    if (!value) {
                        return <p>You must be logged in to access this page.</p>
                    }
                    if (value && !value.verified) {
                        return <p>Your email must be verified to access this page.</p>
                    }

                    const startDateUnix = startDate.unix();
                    const endDateUnix = endDate.unix();
                    const calculatedProfitByDateRange = calculateProfitByDateRange(sales, startDateUnix, endDateUnix);
                    const calculatedExpensesByDateRange = calculateExpensesByDateRange(expenses, startDateUnix, endDateUnix);
                    const monthlyProfitExpensesByDateRange = getMonthlyProfitExpensesByDateRange(sales, expenses, startDate, endDate);
                    const topSellingProductsByDateRange = getTopSellingProductsByDateRange(sales, startDateUnix, endDateUnix, 10);
                    const topSellingCategoriesByDateRange = getTopSellingCategoriesByDateRange(sales, startDateUnix, endDateUnix, 10)
                    const topCustomersByDateRange = getTopCustomersByDateRange(sales, startDateUnix, endDateUnix, 10);

                    return (
                        <>
                            <div className='date-range-container'>
                                <div className='datepicker-container'>
                                    <DatePicker
                                        format={datePickerFormat}
                                        value={startDate}
                                        onChange={(value) => {
                                            const valueToSet = value ? value : moment();
                                            setStartDate(valueToSet);
                                        }}
                                    />
                                </div>
                                <span className='date-range-dash'>-</span>
                                <div className='datepicker-container'>
                                    <DatePicker
                                        format={datePickerFormat}
                                        value={endDate}
                                        onChange={(value) => {
                                            const valueToSet = value ? value : moment();
                                            setEndDate(valueToSet);
                                        }}
                                    />
                                </div>
                            </div>

                            {/* <DownloadButton title='Download PDF' type='primary' className='reports-download-btn' /> */}

                            <div className='reports-cards-container bold totals-grid-container'>
                                <Row gutter={16}>
                                    <Col span={6} className='reports-cards-col'>
                                        <Card>
                                            <label className='reports-card-label'>Total Revenue</label>
                                            <div className='reports-card-value'>{formatNumber(calculatedProfitByDateRange.toFixed(2))}</div>
                                        </Card>
                                    </Col>
                                    <Col span={6} className='reports-cards-col'>
                                        <Card>
                                            <label className='reports-card-label'>Total Expense</label>
                                            <div className='reports-card-value'>{formatNumber(calculatedExpensesByDateRange.toFixed(2))}</div>
                                        </Card>
                                    </Col>
                                    <Col span={6} className='reports-cards-col'>
                                        <Card>
                                            <label className='reports-card-label'>Total Profit</label>
                                            <div className='reports-card-value'>{formatNumber((calculatedProfitByDateRange - calculatedExpensesByDateRange).toFixed(2))}</div>
                                        </Card>
                                    </Col>
                                    <Col span={6} className='reports-cards-col'>
                                        <Card>
                                            <label className='reports-card-label'>Units Sold</label>
                                            <div className='reports-card-value'>{formatNumber(calculateUnitsSoldByDateRange(sales, startDateUnix, endDateUnix))}</div>
                                        </Card>
                                    </Col>
                                </Row>
                            </div>

                            <div className='reports-cards-container'>
                                <Card className='profit-expense-card' bordered={false}>
                                    <div className='profit-expenses-chart-container'>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                width={500}
                                                height={300}
                                                data={monthlyProfitExpensesByDateRange}
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="dateName" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="profit" fill="#82ca9d" />
                                                <Bar dataKey="expenses" fill="#CA82AF" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>

                            <div className='reports-cards-container'>
                                <Card className='top-products-card' bordered={false}>
                                    <h2 className='report-table-title'>Top Selling Products</h2>
                                    <Table
                                        bordered
                                        dataSource={topSellingProductsByDateRange}
                                        rowKey={(entry) => (`${entry.product.id}`)}
                                        pagination={false}
                                        columns={[
                                            {
                                                title: 'Product Name',
                                                dataIndex: ['product', 'name'],
                                                sorter: (a, b) => {
                                                    return sortByProperty(a.product, b.product, 'name');
                                                }
                                            }, {
                                                title: 'Categories',
                                                dataIndex: ['product', 'categories'],
                                                render: (value) => {
                                                    return _.map(value, category => {
                                                        return <Tag key={category}>{category}</Tag>
                                                    })
                                                },
                                                className: 'no-800'
                                            }, {
                                                title: 'Sold',
                                                dataIndex: 'quantitySold',
                                                render: (value) => (`x ${formatNumber(value)}`),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'quantitySold')
                                                }
                                            }, {
                                                title: 'Revenue',
                                                dataIndex: 'revenue',
                                                render: (value) => (<p className='align-right'>{formatNumber(value.toFixed(2))}</p>),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'revenue')
                                                }
                                            }
                                        ]}
                                    />
                                </Card>
                            </div>

                            <div className='reports-cards-container'>
                                <Card className='top-categories-card' bordered={false}>
                                    <h2 className='report-table-title'>Top Selling Categories</h2>
                                    <Table
                                        bordered
                                        dataSource={topSellingCategoriesByDateRange}
                                        rowKey='category'
                                        pagination={false}
                                        columns={[
                                            {
                                                title: 'Category',
                                                dataIndex: 'category',
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'category')
                                                }
                                            }, {
                                                title: 'Sold Products',
                                                dataIndex: 'quantitySold',
                                                render: (value) => (`x ${formatNumber(value)}`),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'quantitySold')
                                                }
                                            }, {
                                                title: 'Revenue',
                                                dataIndex: 'revenue',
                                                render: (value) => (<p className='align-right'>{formatNumber(value.toFixed(2))}</p>),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'revenue')
                                                }
                                            }
                                        ]}
                                    />
                                </Card>
                            </div>

                            <div className='reports-cards-container'>
                                <Card className='top-customers-card' bordered={false}>
                                    <h2 className='report-table-title'>Top Customers</h2>
                                    <Table
                                        bordered
                                        dataSource={topCustomersByDateRange}
                                        rowKey={(entry) => (`${entry.customer.id}`)}
                                        pagination={false}
                                        expandable={topCustomersExpandableConfig}
                                        columns={[
                                            {
                                                title: 'Customer',
                                                dataIndex: ['customer', 'name'],
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'customer')
                                                },
                                            }, {
                                                title: 'Tran sactions',
                                                dataIndex: 'transactions',
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'transactions')
                                                },
                                                className: 'no-655'
                                            }, {
                                                title: 'Units Bought',
                                                dataIndex: 'units',
                                                render: (value) => (`x ${formatNumber(value)}`),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'units')
                                                },
                                                className: 'no-655'
                                            }, {
                                                title: 'Revenue',
                                                dataIndex: 'revenue',
                                                render: (value) => (<p className='align-right'>{formatNumber(value.toFixed(2))}</p>),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'revenue')
                                                },
                                            }, {
                                                title: 'Profit',
                                                dataIndex: 'profit',
                                                render: (value) => (<p className='align-right'>{formatNumber(value.toFixed(2))}</p>),
                                                sorter: (a, b) => {
                                                    return sortByProperty(a, b, 'profit')
                                                },
                                            }
                                        ]}
                                    />
                                </Card>
                            </div>
                        </>
                    );
                }}
            </userContext.Consumer>
        </div>
    );
}
export default withWindowDimension(Reports);