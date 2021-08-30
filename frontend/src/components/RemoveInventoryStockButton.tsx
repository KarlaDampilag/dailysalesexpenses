import React from 'react';
import * as _ from 'lodash';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Modal, Button, Form, message, Table, Select, InputNumber } from 'antd';
import { MinusOutlined } from '@ant-design/icons';

import { PRODUCTS_BY_USER_QUERY } from './AddInventoryStockButton';

const REMOVE_INVENTORY_STOCK_MUTATION = gql`
mutation REMOVE_INVENTORY_STOCK_MUTATION(
    $id: ID!,
    $inventoryItems: [InventoryItemInput!]!
) {
    removeInventoryStock(
        id: $id,
        inventoryItems: $inventoryItems
    ) {
        id
        name
        inventoryItems {
            id
            product {
                id
                name
            }
            amount
            createdAt
        }
    }
}
`;

interface PropTypes {
    inventory: any; // FIXME use graphql type
    currentInventoryItems: any; // FIXME use graphql type
}

interface InventoryItemProps {
    product: any; // FIXME use graphql type
    currentQuantity: number;
    quantity: number;
}

const RemoveInventoryStockButton = (props: PropTypes) => {
    const initialItems: InventoryItemProps[] = [{
        product: {
            id: null
        },
        currentQuantity: 0,
        quantity: 1
    }];
    const [inventoryItems, setInventoryItems] = React.useState<InventoryItemProps[]>(initialItems);
    const [filteredInventoryItems, setFilteredInventoryItems] = React.useState<InventoryItemProps[]>(initialItems);
    const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);
    const [disable, setDisable] = React.useState<boolean>(false);

    const inventoryItemIds = _.map(inventoryItems, inventoryItem => inventoryItem.product.id);
    const [form] = Form.useForm();

    const [removeInventoryStock, { loading }] = useMutation(REMOVE_INVENTORY_STOCK_MUTATION, {
        variables: { id: props.inventory && props.inventory.id, inventoryItems: filteredInventoryItems },
    });

    const handleProductChange = (inventoryItem: InventoryItemProps, value: string) => {
        const product = JSON.parse(value);
        const updatedInventoryItems = [...inventoryItems];
        const updatedInventoryItem: InventoryItemProps = { ...inventoryItem };
        updatedInventoryItem.product = product;

        const thisItemInCurrentInventoryItems = _.find(props.currentInventoryItems, inventoryItem => product.id == inventoryItem.product.id);
        if (thisItemInCurrentInventoryItems) {
            updatedInventoryItem.currentQuantity = thisItemInCurrentInventoryItems.amount;
        }

        const index = _.findIndex(updatedInventoryItems, inventoryItem);
        updatedInventoryItems.splice(index, 1, updatedInventoryItem);
        setInventoryItems(updatedInventoryItems);

        const filteredItems: InventoryItemProps[] = _.filter(updatedInventoryItems, item => item.product.id != null);
        setFilteredInventoryItems(filteredItems);
    }

    const handleQuantityChange = (inventoryItem: InventoryItemProps, value: number | undefined) => {
        const trueValue = value ? value : 1;
        const updatedInventoryItems = [...inventoryItems];
        const updatedInventoryItem: InventoryItemProps = { ...inventoryItem };
        updatedInventoryItem.quantity = trueValue;
        const index = _.findIndex(updatedInventoryItems, inventoryItem);
        updatedInventoryItems.splice(index, 1, updatedInventoryItem);
        setInventoryItems(updatedInventoryItems);

        const thisItemInCurrentInventoryItems = _.find(props.currentInventoryItems, thisInventoryItem => inventoryItem.product.id == thisInventoryItem.product.id);
        if (thisItemInCurrentInventoryItems && updatedInventoryItem.currentQuantity < trueValue) {
            setDisable(true);
        }

        const filteredItems: InventoryItemProps[] = _.filter(updatedInventoryItems, item => item.product.id != null);
        setFilteredInventoryItems(filteredItems);
    }

    return (
        <>
            <Modal title={`Remove Stock from ${props.inventory && props.inventory.name}`} visible={isShowingModal} onCancel={() => setIsShowingModal(false)} footer={null}>
                <Form form={form} onFinish={async () => {
                    await removeInventoryStock()
                        .then(() => {
                            setIsShowingModal(false);
                            form.resetFields();
                            message.success('Stock added to inventory');
                        })
                        .catch(res => {
                            _.forEach(res.graphQLErrors, error => message.error(error.message));
                            message.error('Please contact SourceCodeXL');
                        });
                }}>
                    <Table
                        dataSource={inventoryItems}
                        rowKey='id'
                        columns={[
                            {
                                width: 300,
                                title: 'Product',
                                dataIndex: 'product',
                                render: (value, record) => {
                                    return (
                                        <Select
                                            style={{ width: '100%' }}
                                            value={value.id && JSON.stringify(value)}
                                            onChange={(value) => handleProductChange(record, value)}
                                            placeholder='Add a product'
                                        >
                                            {
                                                _.map(props.currentInventoryItems, item =>
                                                    <Select.Option
                                                        value={JSON.stringify(item.product)}
                                                        disabled={_.includes(inventoryItemIds, item.product.id)}
                                                        key={item.product.id}
                                                    >
                                                        {item.product.name}
                                                    </Select.Option>
                                                )
                                            }
                                        </Select>
                                    )
                                }
                            }, {
                                title: 'Unit',
                                dataIndex: 'product',
                                render: (value) => (
                                    value && value.unit
                                )
                            }, {
                                title: 'Current Quantity',
                                dataIndex: 'currentQuantity'
                            }, {
                                title: 'Remove Quantity',
                                dataIndex: 'quantity',
                                render: (value, record) => {
                                    const max = record.currentQuantity;

                                    return (
                                        <InputNumber
                                            value={value}
                                            min={1}
                                            max={max}
                                            onChange={(value) => handleQuantityChange(record, value)}
                                        />
                                    )
                                }
                            }
                        ]}
                    />

                    <Form.Item>
                        <Button
                            onClick={() => {
                                const newItems = [...inventoryItems];
                                newItems.push({
                                    product: {
                                        id: null
                                    },
                                    currentQuantity: 0,
                                    quantity: 1
                                });
                                setInventoryItems(newItems);
                            }}
                        >➕ Add Product</Button>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" disabled={loading || disable} loading={loading} style={{ width: '100%' }}>
                            Remov{loading ? 'ing' : 'e '} Stock
                                </Button>
                        <div>
                            {disable && <span>One or more entries are trying to remove an amount that is more than the current amount.</span>}
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
            <Button
                onClick={() => setIsShowingModal(true)}
                size='large'
                icon={<MinusOutlined />}
                className='add-button'
            >
                Remove Stock
            </Button>
        </>
    );
}

export default RemoveInventoryStockButton;