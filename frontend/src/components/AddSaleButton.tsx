import React from 'react';
import { useMutation, useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import { Modal, Form, Input, Select, Button, message, DatePicker, Divider, InputNumber, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import moment from 'moment';
import _ from 'lodash';

import { CUSTOMERS_BY_USER_QUERY } from './Customers';
import { SALES_BY_USER_QUERY } from './Sales';
import { calculateGrossProfitBySaleItems, calculateSubtotalBySaleItems, calculateTotalBySale } from '../services/main';
import { formatNumber } from './utils/index';

const CREATE_SALE_MUTATION = gql`
    mutation CREATE_SALE_MUTATION(
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
        createSaleAndItems(
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
                id
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
    products: any; // FIXME use graphql types
}

interface TableSaleItemProps {
    product: any; // FIXME how to use graphql types in frontend
    salePrice: string;
    costPrice?: string;
    quantity: number;
    timeAdded?: number;
}

interface SaleItemProps {
    product: any; // FIXME how to use graphql types in frontend
    salePrice: string;
    costPrice?: string;
    quantity: number;
}

const AddSaleButton = (props: PropTypes) => {
    const [modalIsVisible, setModalIsVisible] = React.useState<boolean>();
    const [saleItems, setSaleItems] = React.useState<TableSaleItemProps[]>([{
        product: {
            id: null
        },
        salePrice: '0',
        quantity: 1,
        timeAdded: moment.now()
    }]);
    const [customerId, setCustomerId] = React.useState<string>();
    const [timestamp, setTimestamp] = React.useState<number>(moment().unix());
    const [discountType, setDiscountType] = React.useState<string>('FLAT');
    const [discountValue, setDiscountValue] = React.useState<string | null>();
    const [taxType, setTaxType] = React.useState<string>('FLAT');
    const [taxValue, setTaxValue] = React.useState<string | null>();
    const [shipping, setShipping] = React.useState<string | null>();
    const [note, setNote] = React.useState<string>();
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

    const getFilteredSaleItems = (rawSaleItems: TableSaleItemProps[]): SaleItemProps[] => {
        const cleanSaleItems = _(rawSaleItems)
            .filter(saleItem =>  (saleItem.product.id != null))
            .map(saleItem => {
                const duplicate = {...saleItem};
                delete duplicate.timeAdded;
                return duplicate;
            })
            .value();
        return cleanSaleItems;
    };

    const [createSaleAndItems, { loading: createSaleLoading }] = useMutation(CREATE_SALE_MUTATION, {
        variables: { saleItems: getFilteredSaleItems(saleItems), customerId, timestamp, discountType, discountValue, taxType, taxValue, shipping, note },
        update: (cache, payload) => {
            const data: any = cache.readQuery({ query: SALES_BY_USER_QUERY });
            const dataCopy: any = _.cloneDeep(data);
            dataCopy.salesByUser.push(payload.data.createSaleAndItems);
            cache.writeQuery({ query: SALES_BY_USER_QUERY, data: dataCopy });
        }
    });

    const saleItemIds = _.map(saleItems, saleItem => saleItem.product.id);

    const { data: customersByUserData } = useQuery(CUSTOMERS_BY_USER_QUERY);
    const customers = customersByUserData ? customersByUserData.customersByUser : null;

    const handleProductChange = (saleItem: TableSaleItemProps, value: string) => {
        const product = JSON.parse(value);
        const updatedSaleItems = [...saleItems];
        const updatedSaleItem: TableSaleItemProps = { ...saleItem };
        updatedSaleItem.product = product;
        updatedSaleItem.salePrice = product.salePrice;
        updatedSaleItem.costPrice = product.costPrice;
        const index = _.findIndex(updatedSaleItems, saleItem);
        updatedSaleItems.splice(index, 1, updatedSaleItem);
        setSaleItems(updatedSaleItems);
    }

    const handleQuantityChange = (saleItem: TableSaleItemProps, value: number | undefined) => {
        const updatedSaleItems = [...saleItems];
        const updatedSaleItem: TableSaleItemProps = { ...saleItem };
        updatedSaleItem.quantity = value ? value : 1;
        const index = _.findIndex(updatedSaleItems, saleItem);
        updatedSaleItems.splice(index, 1, updatedSaleItem);
        setSaleItems(updatedSaleItems);
    }

    return (
        <>
            <Modal
                title="Add a Sale Record"
                visible={modalIsVisible}
                onCancel={() => setModalIsVisible(false)}
                footer={null}
                className='add-sale-modal'
            >
                <Form
                    form={form}
                    labelAlign='left'
                    onFinish={async () => {
                        if (saleItems.length > 0 && saleItems[0].product.id !== null) {
                            await createSaleAndItems()
                                .then(() => {
                                    setModalIsVisible(false);
                                form.resetFields();
                                setCustomerId(undefined);
                                setSaleItems([{
                                    product: {
                                        id: null
                                    },
                                    salePrice: '0',
                                    quantity: 1,
                                    timeAdded: moment.now()
                                }]);
                                setDiscountType('FLAT');
                                setDiscountValue(undefined);
                                setTaxType('FLAT');
                                setTaxValue(undefined);
                                message.success('Sale record added');
                                })
                                .catch(res => {
                                    _.forEach(res.graphQLErrors, error => message.error(error.message));
                                    message.error('Error creating sale entry. Please contact SourceCodeXL.');
                                });
                        } else {
                            message.error('Minimum of one product is required to record a sale');
                        }
                    }}
                >
                    <Form.Item label='Date of Sale' {...layout} rules={[{ required: true, message: 'This field is required' }]}>
                        <DatePicker
                            allowClear={false}
                            format={'DD-MM-YYYY'}
                            value={moment.unix(timestamp)}
                            onChange={(date) => setTimestamp(moment(date as any).unix())}
                            style={{ width: '190px' }}
                        />
                    </Form.Item>
                    <Form.Item label='Customer' {...layout}>
                        <Select
                            value={customerId}
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
                                    quantity: 1,
                                    timeAdded: moment.now()
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
                        rowKey={(saleItem) => (`${saleItem.product.id}-${saleItem.timeAdded}`)}
                        columns={[
                            {
                                key: 'Product',
                                title: 'Product',
                                dataIndex: 'id',
                                render: (value, record) => (
                                    <Select
                                        style={{ width: '100%', maxWidth: '190px' }}
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
                                )
                            },
                            {
                                key: 'Quantity',
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
                                key: 'Price',
                                title: 'Price',
                                dataIndex: 'salePrice',
                                render: (value) => (
                                    formatNumber(value)
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                key: 'Cost',
                                title: 'Cost',
                                dataIndex: 'costPrice',
                                render: (value) => (
                                    value ? formatNumber(value) : 0
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                key: 'Subtotal',
                                title: 'Subtotal',
                                dataIndex: 'product',
                                render: (value, record) => (
                                    value.salePrice ? record.quantity && formatNumber(parseFloat(Number(value.salePrice * record.quantity).toFixed(2))) : 0
                                ),
                                className: 'no-700 align-right'
                            },
                            {
                                key: 'Profit',
                                title: 'Profit',
                                dataIndex: 'product',
                                render: (value, record) => {
                                    return formatNumber(calculateGrossProfitBySaleItems([record]));
                                },
                                className: 'no-700 align-right'
                            },
                            {
                                key: 'Remove',
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
                                        <th style={{ padding: '16px' }}>{totalQuantity}</th>
                                        <th style={{ padding: '8px' }} className='no-700'></th>
                                        <th style={{ padding: '8px' }} className='no-700'></th>
                                        <th style={{ padding: '8px' }} className='no-700 align-right'><span>{formatNumber(parseFloat(Number(totalSubtotal).toFixed(2)))}</span></th>
                                        <th style={{ padding: '8px' }} className='no-700 align-right'><span>{formatNumber(parseFloat(Number(totalProfit).toFixed(2)))}</span></th>
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
                        name='shipping'
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
                        name="notes"
                        {...layout}
                    >
                        <Input value={note} onChange={e => setNote(e.target.value)} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={createSaleLoading} loading={createSaleLoading} style={{ width: '100%' }}>
                            Add{createSaleLoading ? 'ing' : ' '} Sale Record
                                </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Button
                onClick={() => setModalIsVisible(true)}
                size='large'
                icon={<PlusOutlined />}
                className='add-button btn-add-margin-left'
            >
                <span className='no-550'>Add Sale Record</span>
            </Button>
        </>
    )
}
export default AddSaleButton;
const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 }
}
export { layout };