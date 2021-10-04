import React from 'react';
import { useMutation } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import _ from 'lodash';
import m from 'moment';
import { Button, Form, message, Modal, Table } from 'antd';
import { CloudUploadOutlined } from '@ant-design/icons';

import { SALES_BY_USER_QUERY } from '../Sales';

import ErrorNotificationModal from '../ErrorNotificationModal';

import { ISaleItem, ISaleItemMutationInput } from './ImportSalesButton.props';
import { normalizeParsedData, columns, handleFileUploadChange } from './ImportSalesButton.projections';
import { normalizeFile } from '../ImportProductButton/ImportProductButton.projections';

const CREATE_SALE_MUTATION = gql`
    mutation CREATE_SALE_MUTATION(
        $saleItems: [SaleItemInput!]!,
        $timestamp: Int!,
        $customerId: String,
        $discountType: SpecialSaleDeductionType,
        $discountValue: String,
        $taxType: SpecialSaleDeductionType,
        $taxValue: String,
        $shipping: String,
        $note: String
    ) {
        createSaleAndItems(
            saleItems: $saleItems,
            timestamp: $timestamp,
            customerId: $customerId,
            discountType: $discountType,
            discountValue: $discountValue,
            taxType: $taxType,
            taxValue: $taxValue,
            shipping: $shipping,
            note: $note
        ) {
            id
            timestamp
            customer {
                id
                name
            }
            saleItems {
                id
                quantity
                product {
                    id
                    name
                    salePrice
                    costPrice
                    categories
                }
                salePrice
                costPrice
            }
            discountType
            discountValue
            taxType
            taxValue
            shipping
            note
            createdAt
        }
    }
`;


interface PropTypes {
    products: any[];
}

const ImportSalesButton = (props: PropTypes) => {
    const [isShowingModal, setIsShowingModal] = React.useState<boolean>(false);
    const [isLoadingFile, setIsLoadingFile] = React.useState<boolean>(false);
    const [isShowingErrorNotification, setIsShowingErrorNotification] = React.useState<boolean>(false);
    const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
    const [salesRecordData, setSalesRecordData] = React.useState<{
        previewTableData: ReadonlyArray<ISaleItem>,
        mutationInputData: ReadonlyArray<ISaleItemMutationInput>
    } | null>(null);
    const [form] = Form.useForm();

    const [createSaleAndItems, { loading }] = useMutation(CREATE_SALE_MUTATION, {
        variables: { saleItems: salesRecordData?.mutationInputData, timestamp: m().unix() },
        update: (cache, payload) => {
            const data: any = cache.readQuery({ query: SALES_BY_USER_QUERY });
            const dataCopy: any = _.cloneDeep(data);
            dataCopy.salesByUser.push(payload.data.createSaleAndItems);
            cache.writeQuery({ query: SALES_BY_USER_QUERY, data: dataCopy });
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
            const processedData = normalizeParsedData(output, normalizeParsedDataCallback, props.products);
            setSalesRecordData(processedData);
        }
        setIsLoadingFile(false);
    }

    const handleImportSubmit = async () => {
        if (!_.isEmpty(salesRecordData)) {
            await createSaleAndItems()
                .then(() => {
                    setIsShowingModal(false);
                    form.resetFields();
                    message.success('Sales Record CSV imported', 5);
                })
                .catch(res => {
                    const errorMessages: string[] = [];
                    _.forEach(res.graphQLErrors, error => errorMessages.push(error.message));
                    setErrorMessages(errorMessages);
                    setIsShowingErrorNotification(true);
                });
        } else {
            message.error('Minimum of one sale item is required', 5);
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

            <Modal
                title='Import Sales Record CSV'
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
                        valuePropName='filelist'
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

                <h2>Sales Record Preview:</h2>
                <Table
                    loading={isLoadingFile}
                    dataSource={salesRecordData?.previewTableData}
                    columns={columns}
                    rowKey='productId'
                />

                <Button type="primary" htmlType="submit" loading={loading} disabled={loading} style={{ width: '100%' }} onClick={handleImportSubmit}>
                    Import{loading ? 'ing ' : ' '} Sales Record
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

export default ImportSalesButton;