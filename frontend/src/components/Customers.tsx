import React from 'react';
import * as _ from 'lodash';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Table, message } from 'antd';
import { RightSquareTwoTone, DownSquareTwoTone } from '@ant-design/icons';

import { userContext } from './App';
import AddCustomerButton from './AddCustomerButton';
import UpdateCustomerButton from './UpdateCustomerButton';
import DeleteButton from './DeleteButton';
import { paginationConfig } from './configs';

import { sortByProperty, getColumnSearchProps } from './utils/index';

const CUSTOMERS_BY_USER_QUERY = gql`
    {
        customersByUser(orderBy: createdAt_DESC) {
            id
            name
            email
            phone
            street1
            street2
            city
            state
            zipCode
            country
            createdAt
        }
    }
`;

const DELETE_CUSTOMER_MUTATION = gql`
    mutation DELETE_CUSTOMER_MUTATION($id: ID!) {
        deleteCustomer(id: $id) {
            id
            name
            createdAt
        }
    }
`;

const Customers = () => {
    const [idForDeletion, setIdForDeletion] = React.useState<string>();

    const { data: customersData, loading: customersLoading } = useQuery(CUSTOMERS_BY_USER_QUERY);
    const customers = customersData ? customersData.customersByUser : null;

    const [deleteCustomer] = useMutation(DELETE_CUSTOMER_MUTATION, {
        variables: { id: idForDeletion },
        update: (cache: any, payload: any) => {
            const data = cache.readQuery({ query: CUSTOMERS_BY_USER_QUERY });
            const filteredItems = _.filter(data.customersByUser, item => item.id !== payload.data.deleteCustomer.id);
            cache.writeQuery({ query: CUSTOMERS_BY_USER_QUERY, data: { customersByUser: filteredItems } });
        }
    });

    const allowedForAddress = ['street1', 'street2', 'city', 'state', 'zipCode', 'country'];

    interface DetailsPropsInterface {
        customer: any; // FIXME use sale interface from graphql
        setIdForDeletion: (id: string) => void;
        onDelete: () => void
    }
    const CustomerDetails = (detailsProps: DetailsPropsInterface) => {
        const { email, phone } = detailsProps.customer;
        
        const filteredObj = _.pick(detailsProps.customer, allowedForAddress);
        const addressString = _.filter(Object.values(filteredObj), value => value).join(', ');

        return (
            <div className='customer-detail-mobile'>
                <div className='bring-700'>
                    <p>
                        <UpdateCustomerButton customer={detailsProps.customer} />
                        <DeleteButton
                            className='btn-add-margin-left'
                            onClick={() => detailsProps.setIdForDeletion(detailsProps.customer.id)}
                            onDelete={detailsProps.onDelete}
                        />
                    </p>
                </div>

                <div>
                    <div className='bring-500'>
                        <div className='summary-row'>
                            <span>Email:</span> <span>{email}</span>
                        </div>
                    </div>
                    <div className='bring-500'>
                        <div className='summary-row'>
                            <span>Phone:</span> <span>{phone}</span>
                        </div>
                    </div>
                    <div className='summary-row'>
                        <span>Address:</span><span>{addressString}</span>
                    </div>
                </div>
            </div>
        );
    }

    const onDelete = async () => {
        message.info('Please wait...');
        await deleteCustomer()
            .then(() => {
                message.success('Customer deleted');
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
                        <AddCustomerButton />
                        <Table
                            loading={customersLoading}
                            dataSource={customers}
                            rowKey='id'
                            pagination={paginationConfig}
                            expandable={{
                                expandedRowRender: record => <CustomerDetails customer={record} setIdForDeletion={setIdForDeletion} onDelete={onDelete} />,
                                expandIcon: ({ expanded, onExpand, record }) => (
                                    expanded ? <DownSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-900' />
                                        : <RightSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-900' />
                                )
                            }}
                            columns={[
                                {
                                    title: 'Name',
                                    dataIndex: 'name',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'name');
                                    },
                                    ...getColumnSearchProps('name')
                                },
                                {
                                    title: 'Email',
                                    dataIndex: 'email',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'email');
                                    },
                                    ...getColumnSearchProps('email'),
                                    className: 'no-500'
                                },
                                {
                                    title: 'Phone',
                                    dataIndex: 'phone',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'phone');
                                    },
                                    ...getColumnSearchProps('phone'),
                                    className: 'no-500'
                                },
                                {
                                    title: 'Address',
                                    dataIndex: 'id',
                                    key: 'address',
                                    render: (value, record) => {
                                        const filteredObj = _.pick(record, allowedForAddress);
                                        return (
                                            _.filter(Object.values(filteredObj), value => value).join(', ')
                                        )
                                    },
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'address');
                                    },
                                    ...getColumnSearchProps('address'),
                                    className: 'no-900'
                                },
                                {
                                    title: 'Edit',
                                    dataIndex: 'id',
                                    key: 'edit',
                                    render: (value, record) => {
                                        return (
                                            <UpdateCustomerButton customer={record} />
                                        );
                                    },
                                    className: 'no-700'
                                },
                                {
                                    title: 'Delete ',
                                    dataIndex: 'id',
                                    key: 'edit',
                                    render: (value) => {
                                        return (
                                            <DeleteButton
                                                onClick={() => setIdForDeletion(value)}
                                                onDelete={onDelete}
                                            />
                                        );
                                    },
                                    className: 'no-700'
                                }
                            ]}
                        />
                    </>
                );
            }}
        </userContext.Consumer>
    );
}
export default Customers;
export { CUSTOMERS_BY_USER_QUERY };