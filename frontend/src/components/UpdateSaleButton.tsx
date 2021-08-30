import React from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Modal, Form, Input, Select, Button, message, DatePicker, Divider, InputNumber, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import * as _ from 'lodash';

import { CUSTOMERS_BY_USER_QUERY } from './Customers';
import { SALES_BY_USER_QUERY } from './Sales';
import { calculateGrossProfitBySaleItems, calculateSubtotalBySaleItems, calculateTotalBySale } from '../services/main';
import { formatNumber } from './utils/index';
import { layout } from './AddSaleButton';

const UPDATE_SALE_MUTATION = gql`
    mutation UPDATE_SALE_MUTATION(
        $id: ID!,
        $saleItems: [SaleItemInput!]!,
        $timestamp: Int!,
        $customerId: String,
        $discountType: SpecialSaleDeductionType,
        $discountValue: String,
        $taxType: SpecialSaleDeductionType,
        $taxValue: String,
        $shipping: String,
        $note: String
    ) {
        updateSaleAndItems(
            id: $id,
            saleItems: $saleItems,
            timestamp: $timestamp,
            customerId: $customerId,
            discountType: $discountType,
            discountValue: $discountValue,
            taxType: $taxType,
            taxValue: $taxValue,
            shipping: $shipping,
            note: $note
        ) {
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


interface PropTypes {
    sale: any; // FIXME how to use graphql types in frontend
    products: any; // FIXME how to use graphql types in frontend
}

interface SaleItemProps {
    product: any; // FIXME how to use graphql types in frontend
    salePrice: string;
    costPrice?: string;
    quantity: number;
}

const UpdateSaleButton = (props: PropTypes) => {
    const cleanSaleItems = props.sale.saleItems;
    _.each(cleanSaleItems, item => {
        delete item.id;
        delete item.__typename;
    });
    const [modalIsVisible, setModalIsVisible] = React.useState<boolean>();
    const [saleItems, setSaleItems] = React.useState<SaleItemProps[]>(cleanSaleItems);
    const [filteredSaleItems, setFilteredSaleItems] = React.useState<SaleItemProps[]>(cleanSaleItems);
    const [customerId, setCustomerId] = React.useState<string>(props.sale.customer && props.sale.customer.id);
    const [timestamp, setTimestamp] = React.useState<number>(props.sale.timestamp);
    const [discountType, setDiscountType] = React.useState<string>(props.sale.discountType);
    const [discountValue, setDiscountValue] = React.useState<string | null>(props.sale.discountValue);
    const [taxType, setTaxType] = React.useState<string>(props.sale.taxType);
    const [taxValue, setTaxValue] = React.useState<string | null>(props.sale.taxValue);
    const [shipping, setShipping] = React.useState<string | null>(props.sale.shipping);
    const [note, setNote] = React.useState<string>(props.sale.note);
    const [total, setTotal] = React.useState<number>();
    const [form] = Form.useForm();

    React.useEffect(() => {
        setTotal(calculateTotalBySale({
            saleItems,
            discountType,
            discountValue,
            taxType,
            taxValue,
            shipping,
        }));
    }, [saleItems, discountType, discountValue, taxType, taxValue, shipping]);

    const [updateSaleAndItems, { loading: updateSaleLoading }] = useMutation(UPDATE_SALE_MUTATION, {
        variables: { id: props.sale.id, saleItems: filteredSaleItems, customerId, timestamp, discountType, discountValue, taxType, taxValue, shipping, note },
        refetchQueries: [{ query: SALES_BY_USER_QUERY }]
    });

    const saleItemIds = _.map(saleItems, saleItem => saleItem.product.id);

    const { data: customersByUserData } = useQuery(CUSTOMERS_BY_USER_QUERY);
    const customers = customersByUserData ? customersByUserData.customersByUser : null;

    const handleProductChange = (saleItem: SaleItemProps, value: string) => {
        const product = JSON.parse(value);
        const updatedSaleItems = [...saleItems];
        const updatedSaleItem: SaleItemProps = { ...saleItem };
        updatedSaleItem.product = product;
        updatedSaleItem.salePrice = product.salePrice;
        updatedSaleItem.costPrice = product.costPrice;
        const index = _.findIndex(updatedSaleItems, saleItem);
        updatedSaleItems.splice(index, 1, updatedSaleItem);
        setSaleItems(updatedSaleItems);

        const filteredItems: SaleItemProps[] = _.filter(updatedSaleItems, item => item.product.id != null);
        setFilteredSaleItems(filteredItems);
    }

    const handleQuantityChange = (saleItem: SaleItemProps, value: number | undefined) => {
        const updatedSaleItems = [...saleItems];
        const updatedSaleItem: SaleItemProps = { ...saleItem };
        updatedSaleItem.quantity = value ? value : 1;
        const index = _.findIndex(updatedSaleItems, saleItem);
        updatedSaleItems.splice(index, 1, updatedSaleItem);
        setSaleItems(updatedSaleItems);

        const filteredItems: SaleItemProps[] = _.filter(updatedSaleItems, item => item.product.id != null);
        setFilteredSaleItems(filteredItems);
    }

    return (
        <>
            <Modal
                title="Update Sale Record"
                visible={modalIsVisible}
                onCancel={() => setModalIsVisible(false)}
                footer={null}
                className='update-sale-modal'
            >
                <Form
                    form={form}
                    labelAlign='left'
                    onFinish={async () => {
                        if (saleItems.length > 0 && saleItems[0].product.id !== null) {
                            await updateSaleAndItems()
                                .then(() => {
                                    setModalIsVisible(false);
                                    form.resetFields();
                                    message.success('Sale record updated');
                                })
                                .catch(res => {
                                    _.forEach(res.graphQLErrors, error => message.error(error.message));
                                    message.error('Error: cannot update. Please contact SourceCodeXL.');
                                });
                        } else {
                            message.error('Minimum of one product is required to record a sale');
                        }
                    }}
                >
                    <Form.Item label='Date of Sale' {...layout} rules={[{ required: true, message: 'This field is required' }]}>
                        <DatePicker
                            allowClear={false}
                            value={moment.unix(timestamp)}
                            format={'DD-MM-YYYY'}
                            onChange={(date) => setTimestamp(moment(date as any).unix())}
                            style={{ width: '190px' }}
                        />
                    </Form.Item>
                    <Form.Item label='Customer' {...layout}>
                        <Select
                            value={customerId ? customerId : undefined}
                            onChange={setCustomerId}
                            style={{ width: '190px' }}
                        >
                            {
                                _.map(customers, customer => (
                                    <Select.Option key={customer.id} value={customer.id}>{customer.name}</Select.Option>
                                ))
                            }
                        </Select>
                    </Form.Item>

                    <Divider />

                    <Form.Item>
                        <Button
                            onClick={() => {
                                const newSaleItems = [...saleItems];
                                newSaleItems.push({
                                    product: {
                                        id: null
                                    },
                                    salePrice: '0',
                                    quantity: 1
                                });
                                setSaleItems(newSaleItems);
                            }}
                            icon={<PlusOutlined />}
                        >Add Product</Button>
                    </Form.Item>

                    <Table
                        size='small'
                        pagination={false}
                        dataSource={saleItems}
                        rowKey={(saleItem) => (`${saleItem.product.id}-${saleItem.quantity}`)}
                        columns={[
                            {
                                title: 'Product',
                                dataIndex: 'id',
                                render: (value, record) => {
                                    delete record.product.__typename;
                                    return (
                                        <Select
                                            style={{ width: '100%', maxWidth: '180px' }}
                                            value={record.product.id && JSON.stringify(record.product)}
                                            onChange={(value) => handleProductChange(record, value)}
                                            placeholder='Add a product'
                                        >
                                            {
                                                _.map(props.products, product =>
                                                    <Select.Option
                                                        value={JSON.stringify(product)}
                                                        disabled={_.includes(saleItemIds, product.id)}
                                                        key={product.id}
                                                    >
                                                        {product.name}
                                                    </Select.Option>
                                                )
                                            }
                                        </Select>
                                    );
                                }
                            },
                            {
                                title: 'Quantity',
                                dataIndex: 'quantity',
                                render: (value, record) => (
                                    <InputNumber
                                        value={value}
                                        min={1}
                                        onChange={(value) => handleQuantityChange(record, value)}
                                    />
                                )
                            },
                            {
                                title: 'Price',
                                dataIndex: 'salePrice',
                                render: (value) => (
                                    formatNumber(value)
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                title: 'Cost',
                                dataIndex: 'costPrice',
                                render: (value) => (
                                    formatNumber(value)
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                title: 'Subtotal',
                                dataIndex: 'id',
                                render: (value, record) => (
                                    record.salePrice && record.quantity && formatNumber(parseFloat(Number(parseFloat(record.salePrice) * record.quantity).toFixed(2)))
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                title: 'Profit',
                                dataIndex: 'product',
                                render: (value, record) => {
                                    return formatNumber(calculateGrossProfitBySaleItems([record]));
                                },
                                className: 'no-700 align-right'
                            },
                            {
                                title: <div className='no-700'>Remove</div>,
                                dataIndex: 'product',
                                render: (value, record) => (
                                    <span
                                        style={{ 'cursor': 'pointer' }}
                                        onClick={() => {
                                            let newSaleItems = [...saleItems];
                                            newSaleItems = _.filter(newSaleItems, newSaleItem => {
                                                return newSaleItem !== record
                                            });
                                            setSaleItems(newSaleItems);
                                            const filteredItems: SaleItemProps[] = _.filter(newSaleItems, item => item.product.id != null);
                                            setFilteredSaleItems(filteredItems);
                                        }}
                                        aria-label='delete'
                                        role='img'
                                    >❌</span>
                                )
                            }
                        ]}
                        summary={(pageData) => {
                            const pageDataCopy = [...pageData];
                            const totalProfit = calculateGrossProfitBySaleItems(pageDataCopy);
                            const totalSubtotal = calculateSubtotalBySaleItems(pageDataCopy);
                            let totalQuantity = 0;
                            _.each(pageDataCopy, saleItem => totalQuantity += saleItem.quantity);

                            return (
                                <>
                                    <tr>
                                        <th style={{ padding: '8px' }}>Total</th>
                                        <th style={{ padding: '16px' }}>{formatNumber(totalQuantity)}</th>
                                        <th style={{ padding: '8px' }} className='no-700'></th>
                                        <th style={{ padding: '8px' }} className='no-700'></th>
                                        <th style={{ padding: '8px' }} className='no-700 align-right'><span>{formatNumber(totalSubtotal)}</span></th>
                                        <th style={{ padding: '8px' }} className='no-700 align-right'><span>{formatNumber(totalProfit)}</span></th>
                                        <th style={{ padding: '8px' }}></th>
                                    </tr>
                                </>
                            )
                        }}
                    />

                    <span>Discount:</span>
                    <div className='deduction-form-row'>
                        <div className='deduction-type-col'>
                            <Form.Item>
                                <Select
                                    defaultValue='FLAT'
                                    style={{ width: '100%' }}
                                    value={discountType}
                                    onChange={(value) => setDiscountType(value)}
                                >
                                    <Select.Option value={'FLAT'} key={'FLAT'}>{'FLAT'}</Select.Option>
                                    <Select.Option value={'PERCENTAGE'} key={'%'}>{'%'}</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className='deduction-value-col'>
                            <Form.Item>
                                <InputNumber
                                    value={discountValue ? parseFloat(discountValue) : 0}
                                    onChange={(value) => {
                                        let valueToSet = null;
                                        if (value) {
                                            valueToSet = value.toString();
                                        }
                                        setDiscountValue(valueToSet)
                                    }}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    <span>Tax:</span>
                    <div className='deduction-form-row'>
                        <div className='deduction-type-col'>
                            <Form.Item>
                                <Select
                                    defaultValue='FLAT'
                                    style={{ width: '100%' }}
                                    value={taxType}
                                    onChange={(value) => setTaxType(value)}
                                >
                                    <Select.Option value={'FLAT'} key={'FLAT'}>{'FLAT'}</Select.Option>
                                    <Select.Option value={'PERCENTAGE'} key={'%'}>{'%'}</Select.Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <div className='deduction-value-col'>
                            <Form.Item>
                                <InputNumber
                                    value={taxValue ? parseFloat(taxValue) : 0}
                                    onChange={(value) => {
                                        let valueToSet = null;
                                        if (value) {
                                            valueToSet = value.toString();
                                        }
                                        setTaxValue(valueToSet)
                                    }}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    <Form.Item
                        label='Shipping'
                        {...layout}
                    >
                        <InputNumber
                            value={shipping ? parseFloat(shipping) : 0}
                            onChange={value => {
                                let valueToSet = null;
                                if (value) {
                                    valueToSet = value.toString();
                                }
                                setShipping(valueToSet);
                            }}
                        />
                    </Form.Item>

                    <Divider />

                    <div>
                        <span className='bold'>TOTAL: {total && formatNumber(total.toFixed(2))}</span>
                    </div>

                    <Divider />

                    <Form.Item
                        label="Notes"
                        {...layout}
                    >
                        <Input value={note} onChange={e => setNote(e.target.value)} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={updateSaleLoading} loading={updateSaleLoading} style={{ width: '100%' }}>
                            Updat{updateSaleLoading ? 'ing' : 'e '} Sale Record
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Button onClick={() => setModalIsVisible(true)}><span aria-label='edit' role='img'>✏️</span></Button>
        </>
    )
}
export default UpdateSaleButton;