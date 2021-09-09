import React from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import { Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { calculateSubtotalBySaleItems, calculateTotalBySale, calculateProfitBySale } from '../../services/main';

export const sortByProperty = (a: any, b: any, propertyName: string): number => {
    if (a && !b) {
        return 1;
    }
    if (b && !a) {
        return -1;
    }
    if (!a && !b) {
        return 0;
    }

    const propertyOne = a[propertyName];
    const propertyTwo = b[propertyName];

    let returnValue = 0;

    if (propertyName === 'customer') {
        return sortByProperty(propertyOne, propertyTwo, 'name');
    }

    if (propertyName === 'address') {
        const allowed = ['street1', 'street2', 'city', 'state', 'zipCode', 'country'];
        const filteredObjA = _.pick(a, allowed);
        const filteredObjB = _.pick(b, allowed);
        const addressA = _.filter(Object.values(filteredObjA), value => value).join(', ');
        const addressB = _.filter(Object.values(filteredObjB), value => value).join(', ');
        return addressA.localeCompare(addressB);
    }

    const propertyType = typeof propertyOne;

    switch (propertyType) {
        case 'string':
            returnValue = propertyOne.localeCompare(propertyTwo);
            break;
        case 'number':
            returnValue = propertyOne - propertyTwo;
            break;
    }

    return returnValue;
}

export const getColumnSearchProps = (propertyName: string) => {
    return {
        filterDropdown(dropDownProps: any) {
            const { setSelectedKeys, selectedKeys, confirm, clearFilters } = dropDownProps;
            return (<div style={{ padding: 8 }}>
                <Input
                    placeholder='Search'
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={confirm}
                    style={{ width: 188, marginBottom: 8, display: 'block' }}
                />
                <Button
                    type='primary'
                    onClick={confirm}
                    icon={<SearchOutlined />}
                    size='small'
                    style={{ width: 90, marginRight: 8 }}
                >
                    Search
                </Button>
                <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
                    Reset
                </Button>
            </div>
            );
        },
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
        ),
        onFilter: (value: any, record: any) => {
            if (propertyName === 'categories') {
                const categoriesInString = record.categories?.toString();
                return categoriesInString.toLowerCase().includes(value.toString().toLowerCase());
            }

            if (propertyName === 'timestamp') {
                const dateInString = moment.unix(record.timestamp).format("DD MMMM YYYY");
                return dateInString.toLowerCase().includes(value.toString().toLowerCase());
            }

            if (propertyName === 'createdAt') {
                const dateInString = moment(record.createdAt).format("DD MMMM YYYY");
                return dateInString.toLowerCase().includes(value.toString().toLowerCase());
            }

            if (propertyName === 'saleItems') {
                const productNames = _.map(record.saleItems, saleItem => {
                    return saleItem.product.name;
                });
                return productNames.toString().toLowerCase().includes(value.toString().toLowerCase());
            }

            if (propertyName === 'customer') {
                const name = record.customer?.name;
                if (name) {
                    return name.toLowerCase().includes(value.toLowerCase());
                } else {
                    return false;
                }
            }

            if (propertyName === 'address') {
                const allowed = ['street1', 'street2', 'city', 'state', 'zipCode', 'country'];
                const filteredObj = _.pick(record, allowed);
                const address = _.filter(Object.values(filteredObj), value => value).join(', ');
                return address.toLowerCase().includes(value.toLowerCase());
            }

            // hack - not an actual property
            if (propertyName === 'subtotal') {
                const subtotal = calculateSubtotalBySaleItems(record.saleItems);
                return subtotal.toString().includes(value.toString());
            }

            // hack - not an actual property
            if (propertyName === 'total') {
                const total = calculateTotalBySale(record);
                return total.toString().includes(value.toString());
            }

            // hack - not an actual property
            if (propertyName === 'profit') {
                const profit = calculateProfitBySale(record);
                return profit.toString().includes(value.toString());
            }

            // hack - not an actual property
            if (propertyName === 'productNameFromTopSellingProducts') {
                return record.product.name.toString().toLowerCase().includes(value.toString().toLowerCase());
            }

            // hack - not an actual property
            if (propertyName === 'categoryFromTopSellingProducts') {
                const categoriesInString = record.product.categories?.toString();
                return categoriesInString.toLowerCase().includes(value.toString().toLowerCase());
            }

            // hack - not an actual property
            if (propertyName === 'categoryFromTopSellingCategories') {
                return record.category.toLowerCase().includes(value.toString().toLowerCase());
            }

            if (record[propertyName]) {
                return record[propertyName].toString().toLowerCase().includes(value.toString().toLowerCase());
            } else {
                return false;
            }
        }
    }
}

export const formatNumber = (value: number | string) => {
    let number = value;
    if (typeof number === 'string') {
        number = Number(number);
    }
    const multiplier = Math.pow(10, 2);
    const rounded = Math.round(number * multiplier) / multiplier;
    return rounded.toLocaleString();
}