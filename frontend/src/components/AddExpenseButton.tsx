import React from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { Modal, Button, Input, Form, message, InputNumber, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import { EXPENSES_BY_USER_QUERY } from './Expenses';
import { layout, tailLayout } from './AddProductButton';

const CREATE_EXPENSE_MUTATION = gql`
mutation CREATE_EXPENSE_MUTATION(
    $name: String!
    $description: String
    $cost: String!
    $timestamp: Int!
) {
    createExpense(
        name: $name
        description: $description
        cost: $cost
        timestamp: $timestamp
    ) {
        id
        name
        description
        cost
        timestamp
        createdAt
    }
}
`;

const AddInventoryButton = () => {
    const [name, setName] = React.useState<string>();
    const [description, setDescription] = React.useState<string>();
    const [cost, setCost] = React.useState<string>();
    const [timestamp, setTimestamp] = React.useState<number>(moment().unix());
    const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);

    const [form] = Form.useForm();

    const [createExpense, { loading }] = useMutation(CREATE_EXPENSE_MUTATION, {
        variables: { name, description, cost, timestamp },
        update: (store, response) => {
            let newData = response.data.createExpense;
            let localStoreData: any = store.readQuery({ query: EXPENSES_BY_USER_QUERY });
            localStoreData = { expensesByUser: _.sortBy([...localStoreData.expensesByUser, newData], 'createdAt').reverse() };
            store.writeQuery({ query: EXPENSES_BY_USER_QUERY, data: localStoreData });
        }
    });

    return (
        <>
            <Modal title='Add an Expense' visible={isShowingModal} onCancel={() => setIsShowingModal(false)} footer={null}>
                <Form {...layout} form={form} onFinish={async () => {
                    await createExpense()
                        .then(() => {
                            setIsShowingModal(false);
                            form.resetFields();
                            message.success('Expense added');
                        })
                        .catch(res => {
                            _.forEach(res.graphQLErrors, error => message.error(error.message));
                        });
                }}>
                    <Form.Item
                        label='Date' {...layout}
                        rules={[{ required: true, message: 'This field is required' }]}
                    >
                        <DatePicker
                            allowClear={false}
                            format={'DD-MM-YYYY'}
                            value={moment.unix(timestamp)}
                            onChange={(date) => setTimestamp(moment(date as any).unix())}
                            style={{ width: '190px' }}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Name"
                        name="name"
                        rules={[{ required: true, message: 'This field is required' }]}
                    >
                        <Input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
                    </Form.Item>

                    <Form.Item
                        label="Description"
                        name="description"
                    >
                        <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} />
                    </Form.Item>

                    <Form.Item
                        label="Cost"
                        name="cost"
                        rules={[{ required: true, message: 'This field is required' }]}
                    >
                        <InputNumber
                            value={cost ? parseFloat(cost) : 0}
                            onChange={(value) => {
                                if (value) {
                                    setCost(value.toString())
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item {...tailLayout}>
                        <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>Add{loading ? 'ing ' : ' '} Expense</Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Button
                onClick={() => setIsShowingModal(true)}
                size='large'
                icon={<PlusOutlined />}
                className='add-button btn-add-margin-left'
            >
                <span className='no-550'>Add Expense</span>
            </Button>
        </>
    );
}

export default AddInventoryButton;