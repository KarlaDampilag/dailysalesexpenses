import * as _ from 'lodash';
import React from 'react';
import gql from 'graphql-tag';
import { useMutation } from '@apollo/react-hooks';
import { Button, Input, Form, Spin, Select, Modal, message } from 'antd';

import { layout, tailLayout } from './AddProductButton';
import { CREATE_CATEGORIES_MUTATION } from './AddProductButton';
import { PRODUCTS_BY_USER_QUERY } from './Products';

interface PropTypes {
  product: any; // FIXME how to use GraphQL types on frontend?
  categories: any[];
}

const UPDATE_PRODUCT_MUTATION = gql`
    mutation UPDATE_PRODUCT_MUTATION(
        $id: ID!
        $name: String
        $salePrice: String
        $costPrice: String
        $sku: String
        $unit: String
        $notes: String
        $image: String
        $largeImage: String
        $categories: [String!]
    ) {
        updateProduct(
            id: $id
            name: $name
            salePrice: $salePrice
            costPrice: $costPrice
            sku: $sku
            unit: $unit
            notes: $notes
            image: $image
            largeImage: $largeImage
            categories: $categories
        ) {
            id
            name
            salePrice
            costPrice
            unit
            sku
            categories
            notes
            image
            largeImage
            createdAt
        }
    }
`;

const UpdateProductButton = (props: PropTypes) => {
  const [name, setName] = React.useState<string>();
  const [salePrice, setSalePrice] = React.useState<string>();
  const [costPrice, setCostPrice] = React.useState<string>();
  const [sku, setSku] = React.useState<string>();
  const [unit, setUnit] = React.useState<string>();
  const [notes, setNotes] = React.useState<string>();
  const [image, setImage] = React.useState<string | null>(null);
  const [largeImage, setLargeImage] = React.useState<string | null>(null);
  const [categories, setCategories] = React.useState<string[]>(props.product.categories);
  const [newCategories, setNewCategories] = React.useState<string[]>([]);
  const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);
  const [imageIsLoading, setImageIsLoading] = React.useState<boolean>(false);

  let options: string[] = [];
  if (props.categories) {
    options = _.map(props.categories, category => category.name);
  }

  const [updateProduct, { loading: updateProductLoading }] = useMutation(UPDATE_PRODUCT_MUTATION, {
    variables: { id: props.product.id, name, salePrice, costPrice, sku, unit, notes, image, largeImage, categories },
    refetchQueries: [{ query: PRODUCTS_BY_USER_QUERY }]
  });

  const [createCategories] = useMutation(CREATE_CATEGORIES_MUTATION, {
    variables: { names: newCategories }
  });

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? e.target.files : [];
    const data = new FormData();
    data.append('file', files[0]);
    data.append('upload_preset', 'sickfits'); // needed by Cloudinary

    setImageIsLoading(true);
    const response = await fetch('https://api.cloudinary.com/v1_1/dlki0o7xf/image/upload', {
      method: 'POST',
      body: data
    });

    const file = await response.json();
    if (file && file.secure_url && file.eager) {
      setImage(file.secure_url);
      setLargeImage(file.eager[0].secure_url);
    } else {
      setImage(null);
      setLargeImage(null);
    }
    setImageIsLoading(false);
  }

  return (
    <>
      <Modal title='Update Product' visible={isShowingModal} onCancel={() => setIsShowingModal(false)} footer={null}>
        <Form
          {...layout}
          initialValues={{
            name: props.product.name,
            salePrice: props.product.salePrice,
            costPrice: props.product.costPrice,
            sku: props.product.sku,
            unit: props.product.unit,
            notes: props.product.notes
          }}
          onFinish={async e => {
            if (newCategories && newCategories.length > 0) {
              await createCategories()
                .catch(res => {
                  _.forEach(res.graphQLErrors, error => message.error(error.message));
                  message.error('Error: cannot update. Please contact SourceCodeXL.');
                });
            }
            if (!image) {
              setImage(props.product.image);
            }

            await updateProduct()
              .then(() => {
                message.success('Product updated');
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
            <Input onChange={e => setName(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Sale Price"
            name="salePrice"
          >
            <Input type='number' onChange={e => setSalePrice(e.target.value.toString())} />
          </Form.Item>

          <Form.Item
            label="Cost Price"
            name="costPrice"
          >
            <Input type='number' onChange={e => setCostPrice(e.target.value.toString())} />
          </Form.Item>

          <Form.Item
            label="SKU"
            name="sku"
          >
            <Input onChange={e => setSku(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Unit"
            name="unit"
          >
            <Input onChange={e => setUnit(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Categories"
          >
            <Select mode='tags' value={categories} onChange={(value: any) => {
              setCategories(value);
              const newCategoriesToSave = _.filter(value, category => options.indexOf(category) < 0);
              setNewCategories(newCategoriesToSave);
            }}>
              {
                options.map((option, key) => (
                  <Select.Option value={option} key={key}>{option}</Select.Option>
                ))
              }
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes"
            name="notes"
          >
            <Input onChange={e => setNotes(e.target.value)} />
          </Form.Item>

          <Form.Item
            label="Image"
          >
            <Input type='file' accept='image/png, image/jpeg' placeholder='Upload an image' onChange={uploadFile} />
            {imageIsLoading && <Spin />}
            {image ? <img src={image} width='200' alt='upload preview' />
              : props.product.image && <img src={props.product.image} width='200' alt='current preview' />}
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit" disabled={imageIsLoading || updateProductLoading} loading={updateProductLoading} style={{ width: '100%' }}>Updat{updateProductLoading ? 'ing' : 'e'} Product</Button>
          </Form.Item>
        </Form>
      </Modal>
      <Button onClick={() => setIsShowingModal(true)}><span aria-label='edit' role='img'>✏️</span></Button>
    </>
  )
}
export default UpdateProductButton;