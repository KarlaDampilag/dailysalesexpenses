import React from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Table, message, Tag } from 'antd';
import { RightSquareTwoTone, DownSquareTwoTone } from '@ant-design/icons';

import { userContext } from './App';
import AddSaleButton from './AddSaleButton';
import UpdateSaleButton from './UpdateSaleButton';
import DeleteButton from './DeleteButton';
import SaleDetails from './SaleDetails';
import ImportSalesButton from './ImportSalesButton/ImportSalesButton';
import { paginationConfig } from './configs';
import { calculateProfitBySale, calculateSubtotalBySaleItems, calculateTotalBySale } from '../services/main';
import { sortByProperty, getColumnSearchProps, formatNumber } from './utils/index';

const PRODUCTS_BY_USER_QUERY = gql`
    {
        productsByUser {
            id
            name
            salePrice
            costPrice
            categories
            sku
        }
    }
`;

const SALES_BY_USER_QUERY = gql`
    {
        salesByUser(orderBy: timestamp_DESC) {
            id
            timestamp
            customer {
                id
                name
            }
            saleItems {
                quantity
                product {
                    id
                    name
                    salePrice
                    costPrice
                    categories
                }
                salePrice
                costPrice
            }
            discountType
            discountValue
            taxType
            taxValue
            shipping
            note
            createdAt
        }
    }
`;

const DELETE_SALE_AND_ITEMS_MUTATION = gql`
    mutation DELETE_SALE_AND_ITEMS_MUTATION($id: ID!) {
        deleteSaleAndItems(id: $id) {
            id
            createdAt
        }
    }
`;

const Sales = () => {
    const [idForDeletion, setIdForDeletion] = React.useState<string>();

    const { data: salesData, loading } = useQuery(SALES_BY_USER_QUERY, {
        fetchPolicy: 'network-only'
    });
    let sales: any;
    if (salesData) {
        sales = _.sortBy(salesData.salesByUser, 'timestamp').reverse();
    } else {
        sales = null;
    }

    const [deleteSaleAndItems] = useMutation(DELETE_SALE_AND_ITEMS_MUTATION, {
        variables: { id: idForDeletion },
        update: (cache: any, payload: any) => {
            const data = cache.readQuery({ query: SALES_BY_USER_QUERY });
            const filteredItems = _.filter(data.salesByUser, item => item.id !== payload.data.deleteSaleAndItems.id);
            cache.writeQuery({ query: SALES_BY_USER_QUERY, data: { salesByUser: filteredItems } });
        }
    });

    const { data: productsByUserData } = useQuery(PRODUCTS_BY_USER_QUERY);
    const products = productsByUserData ? productsByUserData.productsByUser : [];
    _.each(products, product => {
        delete product.__typename;
    });

    const onSaleDelete = async () => {
        message.info('Please wait...');
        await deleteSaleAndItems()
            .then(() => {
                message.success('Sale record deleted');
            })
            .catch(res => {
                _.forEach(res.graphQLErrors, error => message.error(error.message));
                message.error('Error: cannot delete. Please contact SourceCodeXL.');
            });
    }

    return (
        <userContext.Consumer>
            {value => {
                if (!value) {
                    return <p className='retain-margin'>You must be logged in to access this page.</p>
                }
                if (value && !value.verified) {
                    return <p className='retain-margin'>Your email must be verified to access this page.</p>
                }
                return (
                    <>
                        <AddSaleButton products={products} />
                        <ImportSalesButton products={productsByUserData?.productsByUser} />

                        {/*<Tooltip title="Choose 'Save as PDF' under 'Destination' in the next window">
                            <DownloadButton title='Download PDF' onClick={handleExportClick} size='large' />
                        </Tooltip>*/}
                        <div id='section-to-print'>
                            <Table
                                bordered
                                loading={loading}
                                dataSource={sales}
                                rowKey='id'
                                className='sales-table'
                                rowClassName='sales-table-row'
                                expandable={{
                                    expandedRowRender: record => <SaleDetails sale={record} products={products} setIdForDeletion={setIdForDeletion} onDelete={onSaleDelete} />,
                                    expandIcon: ({ expanded, onExpand, record }) => (
                                        expanded ? <DownSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide' />
                                            : <RightSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide' />
                                    )
                                }}
                                pagination={paginationConfig}
                                columns={[
                                    {
                                        title: 'Date',
                                        dataIndex: 'timestamp',
                                        render: (value) => {
                                            return moment.unix(value).format("DD MMMM YYYY");
                                        },
                                        sorter: (a, b) => {
                                            return sortByProperty(a, b, 'timestamp');
                                        },
                                        ...getColumnSearchProps('timestamp')
                                    },
                                    {
                                        title: 'Products',
                                        dataIndex: 'saleItems',
                                        render: (value) => {
                                            return _.map(value, saleItem => {
                                                const maxLength = 22;
                                                const productName = saleItem.product.name.length > maxLength ? saleItem.product.name.substring(0, maxLength).concat('...') : saleItem.product.name;
                                                return <Tag key={saleItem.product.name}>{productName}</Tag>
                                            })
                                        },
                                        ...getColumnSearchProps('saleItems')
                                    },
                                    {
                                        title: 'Subtotal',
                                        dataIndex: 'saleItems',
                                        render: (value) => {
                                            const subtotal = calculateSubtotalBySaleItems(value);
                                            return <p className='align-right'>{formatNumber(subtotal)}</p>
                                        },
                                        sorter: (a, b) => {
                                            const subtotalA = calculateSubtotalBySaleItems(a.saleItems);
                                            const subtotalB = calculateSubtotalBySaleItems(b.saleItems);
                                            return subtotalA - subtotalB;
                                        },
                                        ...getColumnSearchProps('subtotal'),
                                        className: 'no-1300'
                                    },
                                    {
                                        title: 'Total',
                                        dataIndex: 'id',
                                        render: (value, record) => {
                                            const total = calculateTotalBySale(record);
                                            return <p className='align-right'>{formatNumber(total)}</p>
                                        },
                                        sorter: (a, b) => {
                                            const totalA = calculateTotalBySale(a);
                                            const totalB = calculateTotalBySale(b);
                                            return totalA - totalB;
                                        },
                                        ...getColumnSearchProps('total'),
                                        className: 'no-900'
                                    },
                                    {
                                        title: 'Profit',
                                        dataIndex: 'saleItems',
                                        render: (value, record) => {
                                            const profit = calculateProfitBySale(record);
                                            return <p className='align-right'>{formatNumber(profit)}</p>
                                        },
                                        sorter: (a, b) => {
                                            const profitA = calculateProfitBySale(a);
                                            const profitB = calculateProfitBySale(b);
                                            return profitA - profitB;
                                        },
                                        ...getColumnSearchProps('profit'),
                                        className: 'no-1300'
                                    },
                                    {
                                        title: 'Customer',
                                        dataIndex: 'customer',
                                        render: (value) => {
                                            if (value) {
                                                return value.name;
                                            }
                                            return null;
                                        },
                                        sorter: (a, b) => {
                                            return sortByProperty(a, b, 'customer');
                                        },
                                        ...getColumnSearchProps('customer'),
                                        className: 'no-1300'
                                    },
                                    {
                                        title: <div className='section-to-hide'>Edit</div>,
                                        dataIndex: 'id',
                                        key: 'edit',
                                        render: (value, record) => {
                                            return (
                                                <div className='section-to-hide'>
                                                    <UpdateSaleButton sale={record} products={products} />
                                                </div>
                                            );
                                        },
                                        className: 'no-900'
                                    },
                                    {
                                        title: <div className='section-to-hide'>Delete</div>,
                                        dataIndex: 'id',
                                        key: 'edit',
                                        render: (value) => {
                                            return (
                                                <div className='section-to-hide'>
                                                    <DeleteButton
                                                        onClick={() => setIdForDeletion(value)}
                                                        onDelete={onSaleDelete}
                                                    />
                                                </div>
                                            );
                                        },
                                        className: 'no-900'
                                    }
                                ]}
                                summary={(pageData) => {
                                    let subtotal = 0;
                                    let total = 0;
                                    let profit = 0;
                                    _.each(pageData, sale => {
                                        const saleSubTotal = calculateSubtotalBySaleItems(sale.saleItems);
                                        subtotal += saleSubTotal;
                                        const saleTotal = calculateTotalBySale(sale);
                                        total += saleTotal;
                                        const saleProfit = calculateProfitBySale(sale);
                                        profit += saleProfit;
                                    });

                                    return (
                                        <>
                                            <tr>
                                                <th style={{ padding: '8px' }} className='no-900'>Total</th>
                                                <th style={{ padding: '8px' }} className='no-900 section-to-hide'></th>
                                                <th style={{ padding: '8px' }} className='no-900'></th>
                                                <th style={{ padding: '8px' }} className='no-1300 align-right'>{formatNumber(subtotal.toFixed(2))}</th>
                                                <th style={{ padding: '8px' }} className='no-900 align-right'>{formatNumber(total.toFixed(2))}</th>
                                                <th style={{ padding: '8px' }} className='no-1300 align-right'>{formatNumber(profit.toFixed(2))}</th>
                                                <th style={{ padding: '8px' }} className='no-1300'></th>
                                                <th className='no-900'></th>
                                                <th className='no-900'></th>
                                            </tr>
                                        </>
                                    )
                                }}
                            />
                        </div>
                    </>
                );
            }}
        </userContext.Consumer>
    );
}
export default Sales;
export { SALES_BY_USER_QUERY };