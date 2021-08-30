import React from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { Table } from 'antd';

import AddInventoryStockButton from './AddInventoryStockButton';
import RemoveInventoryStockButton from './RemoveInventoryStockButton';

const INVENTORY_BY_USER = gql`
query INVENTORY_BY_USER($id: ID!) {
    inventoryAndItemsByUser(id: $id) {
        id
        name
        inventoryItems {
            id
            product {
                id
                name
                unit
            }
            amount
            createdAt
        }
    }
}
`;

const Inventory = (props: any) => {
    const query = new URLSearchParams(props.location.search);
    const id = query.get('id');

    const { data: inventoryAndItemsData, loading } = useQuery(INVENTORY_BY_USER, {
        variables: { id }
    });
    const inventory = inventoryAndItemsData ? inventoryAndItemsData.inventoryAndItemsByUser : null;
    let inventoryItems = [];
    if (inventory) {
        inventoryItems = inventory.inventoryItems;
    }

    return (
        <>
            <h2>{inventory && inventory.name}</h2>
            <AddInventoryStockButton inventory={inventory} currentInventoryItems={inventoryItems} />
            <RemoveInventoryStockButton inventory={inventory} currentInventoryItems={inventoryItems} />
            <Table
                loading={loading}
                dataSource={inventoryItems}
                rowKey='id'
                columns={[
                    {
                        title: 'Product',
                        dataIndex: 'product',
                        render: (value) => (
                            value && value.name
                        )
                    }, {
                        title: 'Unit',
                        dataIndex: 'product',
                        render: (value) => (
                            value && value.unit
                        )
                    }, {
                        title: 'Quantity',
                        dataIndex: 'id',
                        render: (value, record) => (
                            record.amount
                        )
                    }
                ]}
            />
        </>
    )
}
export default Inventory;