import React from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Table, message } from 'antd';
import { RightSquareTwoTone, DownSquareTwoTone } from '@ant-design/icons';

import { userContext } from './App';
import AddExpenseButton from './AddExpenseButton';
import UpdateExpenseButton from './UpdateExpenseButton';
import DeleteButton from './DeleteButton';
import withWindowDimension from './withWindowDimenstions';
import { paginationConfig } from './configs';

import { sortByProperty, getColumnSearchProps, formatNumber } from './utils/index';

const EXPENSES_BY_USER_QUERY = gql`
    {
        expensesByUser(orderBy: timestamp_DESC) {
            id
            name
            description
            cost
            timestamp
            createdAt
        }
    }
`;

const DELETE_EXPENSE_MUTATION = gql`
    mutation DELETE_EXPENSE_MUTATION($id: ID!) {
        deleteExpense(id: $id) {
            id
            name
            description
            cost
            timestamp
            createdAt
        }
    }
`;

interface Properties {
    windowWidth: number;
}
const Expenses = (props: Properties) => {
    const [idForDeletion, setIdForDeletion] = React.useState<string>();

    const { data, loading } = useQuery(EXPENSES_BY_USER_QUERY);
    const expenses = data ? data.expensesByUser : null;

    // TODO move to projections
    const [deleteExpense] = useMutation(DELETE_EXPENSE_MUTATION, {
        variables: { id: idForDeletion },
        update: (cache: any, payload: any) => {
            const data = cache.readQuery({ query: EXPENSES_BY_USER_QUERY });
            const filteredItems = _.filter(data.expensesByUser, expense => expense.id !== payload.data.deleteExpense.id);
            cache.writeQuery({ query: EXPENSES_BY_USER_QUERY, data: { expensesByUser: filteredItems } });
        }
    });

    interface ExpenseDetailsPropsInterface {
        expense: any; // FIXME use sale interface from graphql
        setIdForDeletion: (id: string) => void;
        onDelete: () => void;
    }
    const ExpenseDetails = (expenseDetailsProps: ExpenseDetailsPropsInterface) => {
        const { name, description, cost } = expenseDetailsProps.expense;
        return (
            <div className='expense-detail-mobile bring-750'>
                <div className='bring-550'>
                    <p>
                        <UpdateExpenseButton expense={expenseDetailsProps.expense} />
                        <DeleteButton
                            className='btn-add-margin-left'
                            onClick={() => expenseDetailsProps.setIdForDeletion(expenseDetailsProps.expense.id)}
                            onDelete={onExpenseDelete}
                        />
                    </p>
                </div>
                <div>
                    <div className='summary-row'>
                        <span>Name:</span> <span>{name}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Description:</span> <span>{description}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Cost:</span> <span>{cost}</span>
                    </div>
                </div>

            </div>
        );
    }

    const onExpenseDelete = React.useCallback(async () => {
        message.info('Please wait...');
        await deleteExpense()
            .then(() => {
                message.success('Expense deleted');
            })
            .catch(res => {
                _.forEach(res.graphQLErrors, error => message.error(error.message));
                message.error('Error: cannot delete. Please contact SourceCodeXL.');
            });
    }, [deleteExpense]);

    const expandableConfig = React.useMemo(() => {
        if (props.windowWidth >= 751) {
            return undefined;
        } else {
            return {
                expandedRowRender: (record: any) => <ExpenseDetails expense={record} setIdForDeletion={setIdForDeletion} onDelete={onExpenseDelete} />,
                expandIcon: (props: any) => {
                    const { expanded, onExpand, record } = props;
                    return (
                        expanded ? <DownSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-750' />
                            : <RightSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-750' />
                    )
                }
            }

        }
    }, [props.windowWidth, onExpenseDelete]);

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
                        <AddExpenseButton />
                        <Table
                            bordered
                            loading={loading}
                            dataSource={expenses}
                            rowKey='id'
                            expandable={expandableConfig}
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
                                    title: 'Name',
                                    dataIndex: 'name',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'name');
                                    },
                                    ...getColumnSearchProps('name')
                                },
                                {
                                    title: 'Description',
                                    dataIndex: 'description',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'description');
                                    },
                                    ...getColumnSearchProps('description'),
                                    className: 'no-750'
                                },
                                {
                                    title: 'Cost',
                                    dataIndex: 'cost',
                                    render: (value) => {
                                        return <p className='align-right'>{formatNumber(value)}</p>;
                                    },
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'cost');
                                    },
                                    ...getColumnSearchProps('cost')
                                },
                                {
                                    title: 'Edit',
                                    dataIndex: 'id',
                                    key: 'edit',
                                    render: (value, record) => {
                                        return (
                                            <UpdateExpenseButton expense={record} />
                                        );
                                    },
                                    className: 'no-550'
                                },
                                {
                                    title: 'Delete ',
                                    dataIndex: 'id',
                                    key: 'edit',
                                    render: (value) => {
                                        return (
                                            <DeleteButton
                                                onClick={() => setIdForDeletion(value)}
                                                onDelete={onExpenseDelete}
                                            />
                                        );
                                    },
                                    className: 'no-550'
                                }
                            ]}
                            summary={(pageData) => {
                                let totalCost = 0;
                                _.each(pageData, expense => totalCost += parseFloat(expense.cost));

                                return (
                                    <>
                                        <tr>
                                            <th style={{ padding: '8px' }}>Total</th>
                                            <th style={{ padding: '8px' }}></th>
                                            <th style={{ padding: '8px' }}></th>
                                            <th style={{ padding: '8px' }} className='align-right'>{formatNumber(totalCost.toFixed(2))}</th>
                                            <th className='no-550'></th>
                                            <th className='no-550'></th>
                                        </tr>
                                    </>
                                )
                            }}
                        />
                    </>
                );
            }}
        </userContext.Consumer>
    );
}
export default withWindowDimension(Expenses);
export { EXPENSES_BY_USER_QUERY };