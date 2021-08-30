import React from 'react';
import * as _ from 'lodash';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { Button, Input, Form, Modal, message } from 'antd';

import { layout, tailLayout } from './AddProductButton';

interface PropTypes {
  inventory: any; // FIXME how to use GraphQL types on frontend?
}

const UPDATE_INVENTORY_MUTATION = gql`
    mutation UPDATE_INVENTORY_MUTATION(
        $id: ID!
        $name: String
    ) {
        updateInventory(
            id: $id
            name: $name
        ) {
            id
            name
        }
    }
`;

const UpdateInventoryButton = (props: PropTypes) => {
  const [name, setName] = React.useState<string>();
  const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);

  const [updateInventory, { loading: updateInventoryLoading }] = useMutation(UPDATE_INVENTORY_MUTATION, {
    variables: { id: props.inventory.id, name }
  });

  return (
    <>
      <Modal title='Update Inventory' visible={isShowingModal} onCancel={() => setIsShowingModal(false)} footer={null}>
        <Form
          {...layout}
          onFinish={async e => {
            await updateInventory()
              .then(() => {
                message.success('Inventory updated');
                setIsShowingModal(false);
              })
              .catch(res => {
                _.forEach(res.graphQLErrors, error => message.error(error.message));
                message.error('Error: cannot update. Please contact SourceCodeXL.');
              });
          }}
        >
          <Form.Item
            label="Name"
            name="name"
          >
            <Input defaultValue={props.inventory.name} onChange={e => setName(e.target.value)} />
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit" disabled={updateInventoryLoading} loading={updateInventoryLoading}>Updat{updateInventoryLoading ? 'ing' : 'e'} Inventory</Button>
          </Form.Item>
        </Form>
      </Modal>
      <Button onClick={() => setIsShowingModal(true)}>Edit</Button>
    </>
  )
}
export default UpdateInventoryButton;