import React from 'react';
import * as _ from 'lodash';
import moment from 'moment';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { Button, Input, Form, Modal, message, InputNumber, DatePicker } from 'antd';

import { layout, tailLayout } from './AddProductButton';
import { EXPENSES_BY_USER_QUERY } from './Expenses';

interface PropTypes {
  expense: any; // FIXME how to use GraphQL types on frontend?
}

const UPDATE_EXPENSE_MUTATION = gql`
    mutation UPDATE_EXPENSE_MUTATION(
        $id: ID!
        $name: String
        $description: String
        $cost: String
        $timestamp: Int!
    ) {
      updateExpense(
            id: $id
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
        }
    }
`;

const UpdateExpenseButton = (props: PropTypes) => {
  const [name, setName] = React.useState<string>();
  const [description, setDescription] = React.useState<string>();
  const [cost, setCost] = React.useState<string>();
  const [timestamp, setTimestamp] = React.useState<number>(props.expense.timestamp);
  const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);

  const [updateExpense, { loading }] = useMutation(UPDATE_EXPENSE_MUTATION, {
    variables: { id: props.expense.id, name, description, cost, timestamp },
    refetchQueries: [{ query: EXPENSES_BY_USER_QUERY }]
  });

  return (
    <>
      <Modal title='Update Expense' visible={isShowingModal} onCancel={() => setIsShowingModal(false)} footer={null}>
        <Form
          {...layout}
          initialValues={{
            name: props.expense.name,
            description: props.expense.description,
            cost: parseFloat(props.expense.cost)
          }}
          onFinish={async e => {
            await updateExpense()
              .then(() => {
                message.success('Expense updated');
                setIsShowingModal(false);
              })
              .catch(res => {
                _.forEach(res.graphQLErrors, error => message.error(error.message));
                message.error('Error: cannot update. Please contact SourceCodeXL.');
              });
          }}
        >
          <Form.Item
            label='Date' {...layout}
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
          >
            <Input onChange={e => setName(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
          >
            <Input onChange={e => setDescription(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Cost"
            name="cost"
          >
            <InputNumber onChange={value => value && setCost(value.toString())} />
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit" disabled={loading} loading={loading} style={{ width: '100%' }}>Updat{loading ? 'ing' : 'e'} Expense</Button>
          </Form.Item>
        </Form>
      </Modal>
      <Button onClick={() => setIsShowingModal(true)}><span aria-label='edit' role='img'>✏️</span></Button>
    </>
  )
}
export default UpdateExpenseButton;