import React from 'react';
import * as _ from 'lodash';
import gql from 'graphql-tag';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { Tag, Table, message } from 'antd';
import { RightSquareTwoTone, DownSquareTwoTone } from '@ant-design/icons';

import { userContext } from './App';
import AddProductButton from './AddProductButton';
import UpdateProductButton from './UpdateProductButton';
import DeleteButton from './DeleteButton';
import withWindowDimension from './withWindowDimenstions';
import { paginationConfig } from './configs';
import { sortByProperty, getColumnSearchProps, formatNumber } from './utils/index';

const PRODUCTS_BY_USER_QUERY = gql`
    {
        productsByUser {
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

const CREATE_CATEGORIES_MUTATION = gql`
    mutation CREATE_CATEGORIES_MUTATION($names: [String!]!) {
        createCategories(names: $names) {
            id
            name
        }
    }
`;

const CATEGORIES_BY_USER_QUERY = gql`
    {
        categoriesByUser{
            id
            name
        }
    }
`;

const DELETE_PRODUCT_MUTATION = gql`
    mutation DELETE_PRODUCT_MUTATION($id: ID!) {
        deleteProduct(id: $id) {
            id
            name
            salePrice
            costPrice
            unit
            categories
            notes
            image
            createdAt
        }
    }
`;

interface Properties {
    windowWidth: number;
}
const Products = (props: Properties) => {
    const [productIdForDeletion, setProductIdForDeletion] = React.useState<string>();

    const { data: productsData, loading } = useQuery(PRODUCTS_BY_USER_QUERY);
    const products = productsData ? productsData.productsByUser : null;

    const { data } = useQuery(CATEGORIES_BY_USER_QUERY);
    const categoriesData = data ? data.categoriesByUser : null;

    // TODO move to projections
    const [deleteProduct] = useMutation(DELETE_PRODUCT_MUTATION, {
        variables: { id: productIdForDeletion },
        update: (cache: any, payload: any) => {
            // Read cache for the products
            const data = cache.readQuery({ query: PRODUCTS_BY_USER_QUERY });

            const filteredItems = _.filter(data.productsByUser, product => product.id !== payload.data.deleteProduct.id);
            cache.writeQuery({ query: PRODUCTS_BY_USER_QUERY, data: { productsByUser: filteredItems } });
        }
    });

    interface ProductDetailsPropsInterface {
        product: any; // FIXME use sale interface from graphql
        setIdForDeletion: (id: string) => void;
        onDelete: () => void
    }
    const ProductDetails = (productDetailsProps: ProductDetailsPropsInterface) => {
        const { name, image, salePrice, costPrice, sku, categories, notes } = productDetailsProps.product;
        return (
            <div className='product-detail-mobile'>
                <div className='bring-550'>
                    <p>
                        <UpdateProductButton product={productDetailsProps.product} categories={categoriesData} />
                        <DeleteButton
                            className='btn-add-margin-left'
                            onClick={() => productDetailsProps.setIdForDeletion(productDetailsProps.product.id)}
                            onDelete={onProductDelete}
                        />
                    </p>
                </div>

                <div>{image && <img src={image} alt={name} className='product-img' />}</div>

                <div>
                    <div className='summary-row'>
                        <span>Sale Price:</span> <span>{formatNumber(salePrice)}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Cost Price:</span> <span>{formatNumber(costPrice)}</span>
                    </div>
                    <div className='summary-row'>
                        <span>SKU:</span> <span>{sku}</span>
                    </div>
                    <div className='summary-row'>
                        <span>Categories:</span>
                        <span>
                            {
                                _.map(categories, category => {
                                    return <Tag key={category}>{category}</Tag>
                                })
                            }
                        </span>
                    </div>
                    <div className='summary-row'>
                        <span>Notes:</span> <span>{notes}</span>
                    </div>
                </div>
            </div>
        );
    }

    const onProductDelete = React.useCallback(async () => {
        message.info('Please wait...');
        await deleteProduct()
            .then(() => {
                message.success('Product deleted');
            })
            .catch(res => {
                _.forEach(res.graphQLErrors, error => message.error(error.message));
                message.error('Error: cannot delete product. Please contact SourceCodeXL.');
            });
    }, [deleteProduct]);

    const expandableConfig = React.useMemo(() => {
        if (props.windowWidth >= 1301) {
            return undefined;
        } else {
            return {
                expandedRowRender: (record: any) => <ProductDetails product={record} setIdForDeletion={setProductIdForDeletion} onDelete={onProductDelete} />,
                expandIcon: (props: any) => {
                    const { expanded, onExpand, record } = props;
                    return (
                    expanded ? <DownSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-1300' />
                        : <RightSquareTwoTone onClick={e => onExpand(record, e)} style={{ fontSize: '18pt' }} className='section-to-hide bring-1300' />
                    )
                }
            }
        }
    }, [props.windowWidth, onProductDelete]);

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
                        <AddProductButton categories={categoriesData} />
                        <Table
                            bordered
                            loading={loading}
                            dataSource={products}
                            rowKey='id'
                            expandable={expandableConfig}
                            pagination={paginationConfig}
                            columns={[
                                {
                                    dataIndex: 'image',
                                    render: (value, record) => {
                                        if (value) {
                                            return <img src={value} alt={record.name} width='150px' />
                                        }
                                        return null;
                                    },
                                    className: 'no-700'
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
                                    title: <div><span className='no-1300'>Sale </span>Price</div>,
                                    dataIndex: 'salePrice',
                                    render: (value) => {
                                        return <p className='align-right'>{formatNumber(value)}</p>;
                                    },
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'salePrice');
                                    },
                                    ...getColumnSearchProps('salePrice')
                                },
                                {
                                    title: 'Cost Price',
                                    dataIndex: 'costPrice',
                                    render: (value) => {
                                        return <p className='align-right'>{formatNumber(value)}</p>;
                                    },
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'costPrice');
                                    },
                                    ...getColumnSearchProps('costPrice'),
                                    className: 'no-1300'
                                },
                                {
                                    title: 'SKU',
                                    dataIndex: 'sku',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'sku');
                                    },
                                    ...getColumnSearchProps('sku'),
                                    className: 'no-1000'
                                },
                                {
                                    title: 'Categories',
                                    dataIndex: 'categories',
                                    render: (value) => {
                                        return _.map(value, category => {
                                            return <Tag key={category}>{category}</Tag>
                                        })
                                    },
                                    ...getColumnSearchProps('categories'),
                                    className: 'no-1000'
                                },
                                {
                                    title: 'Notes',
                                    dataIndex: 'notes',
                                    sorter: (a, b) => {
                                        return sortByProperty(a, b, 'notes');
                                    },
                                    ...getColumnSearchProps('notes'),
                                    className: 'no-1300'
                                },
                                {
                                    title: 'Edit',
                                    dataIndex: 'id',
                                    key: 'edit',
                                    render: (value, record) => {
                                        return (
                                            <UpdateProductButton product={record} categories={categoriesData} />
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
                                                onClick={() => setProductIdForDeletion(value)}
                                                onDelete={onProductDelete}
                                            />
                                        );
                                    },
                                    className: 'no-550'
                                }
                            ]}
                        />
                    </>
                );
            }}
        </userContext.Consumer>
    )
}
export default withWindowDimension(Products);
export { PRODUCTS_BY_USER_QUERY, CATEGORIES_BY_USER_QUERY, CREATE_CATEGORIES_MUTATION };