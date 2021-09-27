import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import _ from 'lodash';
import { Button, Form, message, Modal, Table } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';

import { PRODUCTS_BY_USER_QUERY } from '../Products';

import ErrorNotificationModal from '../ErrorNotificationModal';

import IProduct from './ImportProductButton.props';
import { normalizeFile, normalizeParsedData, columns, handleFileUploadChange } from './ImportProductButton.projections';

const CREATE_PRODUCTS_MUTATION = gql`
    mutation CREATE_PRODUCTS_MUTATION(
        $products: [ProductInput!]!
    ) {
        createProducts(
            products: $products
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



const ImportProductButton = () => {
    const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);
    const [isLoadingFile, setIsLoadingFile] = React.useState<boolean>(false);
    const [isShowingErrorNotification, setIsShowingErrorNotification] = React.useState<boolean>(false);
    const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
    const [products, setProducts] = React.useState<ReadonlyArray<IProduct>>([]);
    const [form] = Form.useForm();

    const [createProducts, { loading: createProductsLoading }] = useMutation(CREATE_PRODUCTS_MUTATION, {
        variables: { products },
        update: (store, response) => {
            let newData = response.data.createProducts;
            let localStoreData: any = store.readQuery({ query: PRODUCTS_BY_USER_QUERY });
            localStoreData = { productsByUser: [...localStoreData.productsByUser, ...newData] };
            store.writeQuery({ query: PRODUCTS_BY_USER_QUERY, data: localStoreData });
        }
    });

    const normalizeParsedDataCallback = (errorMessages: string[]) => {
        setErrorMessages(errorMessages);
        setIsShowingErrorNotification(true);
    }

    const parserCallback = (error: any, output: any) => {
        if (error) {
            const errorMessages = [];
            errorMessages.push(error.message);
            errorMessages.push(`Error code: ${error?.code}`);
            setErrorMessages(errorMessages);
            setIsShowingErrorNotification(true);
        }
        if (output) {
            const products = normalizeParsedData(output, normalizeParsedDataCallback);
            setProducts(products);
        }
        setIsLoadingFile(false);
    }

    const handleImportSubmit = async () => {
        if (!_.isEmpty(products)) {
            await createProducts()
                .then(() => {
                    setIsShowingModal(false);
                    form.resetFields();
                    message.success('Products CSV imported', 5);
                })
                .catch(res => {
                    const errorMessages: string[] = [];
                    _.forEach(res.graphQLErrors, error => errorMessages.push(error.message));
                    setErrorMessages(errorMessages);
                    setIsShowingErrorNotification(true);
                });
        } else {
            message.error('Minimum of one product is required', 5);
        }
    }

    return (
        <>
            <ErrorNotificationModal
                visible={isShowingErrorNotification}
                title='There was a problem parsing your csv file'
                messages={errorMessages}
                onClose={() => setIsShowingErrorNotification(false)}
            />
            <ErrorNotificationModal
                visible={isShowingErrorNotification}
                title='There was a problem parsing your csv file'
                messages={errorMessages}
                onClose={() => setIsShowingErrorNotification(false)}
            />

            <Modal
                title='Import Product CSV'
                visible={isShowingModal}
                onCancel={() => setIsShowingModal(false)}
                footer={null}
                className='import-csv-modal'
            >
                <Form
                    form={form}
                    {...layout}
                >
                    <Form.Item
                        name='upload'
                        label='Upload'
                        valuePropName='fileList'
                        getValueFromEvent={normalizeFile}
                        rules={[{ required: true, message: 'Please upload a csv file!' }]}
                    >
                        <input
                            type='file'
                            id='sectionFileUpload'
                            name='sectionFileUpload'
                            accept='.csv'
                            onChange={(e) => {
                                setIsLoadingFile(true);
                                handleFileUploadChange(e, parserCallback);
                            }} />
                    </Form.Item>
                </Form>

                <h2>Products Preview:</h2>
                <Table
                    loading={isLoadingFile}
                    dataSource={products}
                    columns={columns}
                />

                <Button type="primary" htmlType="submit" loading={createProductsLoading} disabled={createProductsLoading} style={{ width: '100%' }} onClick={handleImportSubmit}>
                    Import{createProductsLoading ? 'ing ' : ' '} Products
                </Button>
            </Modal>
            <Button
                onClick={() => setIsShowingModal(true)}
                size='large'
                icon={<CloudUploadOutlined />}
                className='add-button btn-add-margin-left'
            >
                <span>Import CSV</span>
            </Button>
        </>
    );
}

const layout = {
    labelCol: { span: 3 },
    wrapperCol: { span: 21 },
};

export default ImportProductButton;