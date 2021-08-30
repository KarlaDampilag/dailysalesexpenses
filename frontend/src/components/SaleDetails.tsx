import * as React from 'react';
import * as _ from 'lodash';
import { Table, Divider } from 'antd';

import { calculateGrossProfitBySaleItems, calculateProfitBySale, calculateSubtotalBySaleItems, calculateTotalBySale } from '../services/main';
import { formatNumber } from './utils/index';
import UpdateSaleButton from './UpdateSaleButton';
import DeleteButton from './DeleteButton';

interface PropTypes {
    sale: any; // FIXME use sale interface from graphql
    products: any; // FIXME how to use graphql types in frontend
    setIdForDeletion: (id: string) => void;
    onDelete: () => void
}

const SaleDetails = (props: PropTypes) => {
    const renderDiscount = () => {
        if (props.sale.discountType && props.sale.discountValue) {
            if (props.sale.discountType === 'FLAT') {
                return props.sale.discountValue;
            }
            return `${props.sale.discountValue} %`
        }
        return null;
    }

    const renderTax = () => {
        if (props.sale.taxType && props.sale.taxValue) {
            if (props.sale.taxType === 'FLAT') {
                return props.sale.taxValue;
            }
            return `${props.sale.taxValue} %`;
        }
        return null;
    }

    return (
        <div key={props.sale.id}>
            <div className='bring-900'>
                <p>
                    <UpdateSaleButton sale={props.sale} products={props.products} />
                    <DeleteButton
                        className='btn-add-margin-left'
                        onClick={() => props.setIdForDeletion(props.sale.id)}
                        onDelete={props.onDelete}
                    />
                </p>
            </div>
            <div className='bold'><p>SALE DETAILS:</p></div>
            {
                props.sale && (<>
                    <Table
                        className='no-550'
                        size='small'
                        pagination={false}
                        dataSource={props.sale.saleItems}
                        rowKey={(saleItem) => (`${saleItem.product.id}-${saleItem.quantity}`)}
                        columns={[
                            {
                                title: 'Product',
                                dataIndex: 'id',
                                render: (value, record) => (
                                    record.product.name
                                )
                            },
                            {
                                title: 'Quantity',
                                dataIndex: 'quantity',
                                render: (value) => (formatNumber(value))
                            },
                            {
                                title:  <div className='align-right'>Price</div>,
                                dataIndex: 'salePrice',
                                render: (value) => (formatNumber(value)),
                                className: 'align-right'
                            },
                            {
                                title: <div className='align-right'>Cost</div>,
                                dataIndex: 'costPrice',
                                render: (value) => (formatNumber(value)),
                                className: 'align-right'
                            },
                            {
                                title: <div className='align-right'>Subtotal</div>,
                                dataIndex: 'id',
                                render: (value, record) => {
                                    return formatNumber(calculateSubtotalBySaleItems([record]));
                                },
                                className: 'align-right'
                            },
                            {
                                title: <div className='align-right'>Profit</div>,
                                dataIndex: 'product',
                                render: (value, record) => {
                                    return formatNumber(calculateGrossProfitBySaleItems([record]));
                                },
                                className: 'align-right'
                            }
                        ]}
                        summary={(pageData) => {
                            const pageDataCopy = [...pageData];
                            const totalProfit = calculateGrossProfitBySaleItems(pageDataCopy);
                            const totalSubtotal = calculateSubtotalBySaleItems(pageDataCopy);
                            let totalQuantity: number = 0;
                            _.each(pageDataCopy, saleItem => {
                                totalQuantity += saleItem.quantity;
                            });

                            return (
                                <>
                                    <tr>
                                        <th style={{ padding: '8px' }}>Total</th>
                                        <th style={{ padding: '8px' }}>{formatNumber(totalQuantity)}</th>
                                        <th style={{ padding: '8px' }}></th>
                                        <th style={{ padding: '8px' }}></th>
                                        <th style={{ padding: '8px' }} className='align-right'>{formatNumber(totalSubtotal)}</th>
                                        <th style={{ padding: '8px' }} className='align-right'>{formatNumber(totalProfit)}</th>
                                    </tr>
                                </>
                            )
                        }}
                    />

                    <div className='bring-550'>
                        {
                            _.map(props.sale.saleItems, saleItem => (
                                <div className='sale-details-product-mobile' key={`${saleItem.product.id}-${saleItem.quantity}`}>
                                    <b>{saleItem.product.name}</b>
                                    <div className='summary-row'>
                                        <span>Quantity:</span> <span>{formatNumber(saleItem.quantity)}</span>
                                    </div>
                                    <div className='summary-row'>
                                        <span className='align-right'>Price:</span> <span>{formatNumber(saleItem.salePrice)}</span>
                                    </div>
                                    <div className='summary-row'>
                                        <span className='align-right'>Cost:</span> <span>{formatNumber(saleItem.costPrice)}</span>
                                    </div>
                                    <div className='summary-row'>
                                        <span className='align-right'>Subtotal:</span> <span>{formatNumber(calculateSubtotalBySaleItems([saleItem]))}</span>
                                    </div>
                                    <div className='summary-row'>
                                        <span className='align-right'>Profit:</span> <span>{formatNumber(calculateGrossProfitBySaleItems([saleItem]))}</span>
                                    </div>
                                    <Divider />
                                </div>
                            ))
                        }
                    </div>

                    <div>
                        <div className='summary-row'>
                            <span>SUBTOTAL:</span> <span>{formatNumber(calculateSubtotalBySaleItems(props.sale.saleItems))}</span>
                        </div>
                        <div className='summary-row'>
                            <span>DISCOUNT:</span> <span>{renderDiscount()}</span>
                        </div>
                        <div className='summary-row'>
                            <span>TAX:</span> <span>{renderTax()}</span>
                        </div>
                        <div className='summary-row'>
                            <span>SHIPPING:</span> <span>{props.sale.shipping}</span>
                        </div>
                        <div className='summary-row bold' style={{ marginTop: '.5em' }}>
                            <span>TOTAL:</span> <span>{formatNumber(calculateTotalBySale(props.sale))}</span>
                        </div>
                    </div>

                    <Divider />

                    <div>
                        <div className='summary-row-last'>
                            <span>SUB-PROFIT:</span> <span>{formatNumber(calculateGrossProfitBySaleItems(props.sale.saleItems))}</span>
                            <span>(products prices minus costs)</span>
                        </div>
                        <div className='summary-row-last' style={{ marginTop: '.5em' }}>
                            <span>PROFIT:</span> <span>{formatNumber(calculateProfitBySale(props.sale))}</span>
                            <span>(minus discount)</span>
                        </div>
                    </div>

                    <div className='bring-550'>
                        <Divider />
                        <div>CUSTOMER: {props.sale.customer?.name}</div>
                    </div>

                    <Divider />

                    <div>NOTE: {props.sale.note}</div>
                </>)
            }
        </div>
    )
}
export default SaleDetails;