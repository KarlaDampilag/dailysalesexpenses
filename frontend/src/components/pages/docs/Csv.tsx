import React from 'react';
import { Table, Image } from 'antd';

import HighlightParagraph from '../../HighlightParagraph';
import productCSVPlainTextImage from '../../../images/products-csv-screenshot.png';
import productCSVSpreadSheetImage from '../../../images/products-csv-table-screenshot.png';
import salesRecordCSVPlainTextImage from '../../../images/sales-record-csv-screenshot.png';
import salesRecordCSVSpreadShetImage from '../../../images/sales-record-csv-table-screenshot.png';

const Csv = () => {
    const productTableData = React.useMemo(() => {
        return ([
            {
                column: 'name',
                description: 'Name of your product.',
                required: 'required'
            }, {
                column: 'salePrice',
                description: 'Price of your product.',
                required: 'required'
            }, {
                column: 'costPrice',
                description: 'Cost of your product. This field is used in the application to calculate your profit from the product (sale price - cost price).',
                required: null
            }, {
                column: 'sku',
                description: 'Unique identifier for each product. It is not a required value, but is highly recommended to provide, because the SKU of the product is used to match with existing products in the sales record CSV import.',
                required: null
            }, {
                column: 'unit',
                description: 'Unit of measurement of your product.',
                required: null
            }, {
                column: 'categories',
                description: 'Categories of your product. Each category should be separated by a semi-colon in the CSV file (please see the sample product CSV file above).',
                required: null
            }, {
                column: 'notes',
                description: 'Notes you want to attach to your product.',
                required: null
            }
        ])
    }, []);

    const salesRecordTableData = React.useMemo(() => {
        return ([
            {
                column: 'sku',
                description: 'SKU of the product. Will be used to map the sale item with an existing product. You must already have a product entry in the application with this SKU.',
                required: 'required'
            }, {
                column: 'quantity',
                description: 'Quantity of product sold.',
                required: 'required'
            }
        ])
    }, []);

    const tableColumns = React.useMemo(() => {
        return ([
            {
                dataIndex: 'column',
                title: 'Column'
            }, {
                dataIndex: 'description',
                title: 'Description'
            }, {
                dataIndex: 'required',
                title: 'Required'
            }
        ])
    }, []);

    return (
        <div className='static-pages-container'>
            <h1>CSV Import</h1>

            <h2>On This Page</h2>
            <ul>
                <li><a href='#using-csv-files'>Using CSV Files</a></li>
                <li><a href='#get-sample-csv'>Get A Sample CSV File</a></li>
                <li><a href='#csv-file-format'>CSV File Format</a></li>
                <li><a href='#product-csv-description'>Description of the Product Import CSV File</a></li>
                <li><a href='#sales-record-csv-description'>Description of the Sales Record Import CSV File</a></li>
            </ul>

            <h2 id='using-csv-files'>Using CSV Files</h2>
            <p>CSV (comma-separated values) files are generated from a spreadsheet software (e.g. Microsoft Excel or Google Sheets). By using our CSV import features, you can add a large number of products and sales records and their
                details into the application at one time, instead of adding them one by one.</p>

            <h2 id='get-sample-csv'>Get A Sample CSV File</h2>
            <p>You can download and view a sample CSV file to use as basis or template:</p>
            <ul>
                <li><a href={`${process.env.PUBLIC_URL}/downloadable/csv/products.csv`} download='products_sample.csv'>Click to download <b>Products</b> CSV file sample</a></li>
                <li><a href={`${process.env.PUBLIC_URL}/downloadable/csv/sales.csv`} download='sales_record_sample.csv'>Click to download <b>Sales records</b> CSV file sample</a></li>
            </ul>
            <h3>It should look like this:</h3>
            <div>
                <div>
                    <p>1. Products CSV file sample:</p>
                    <p>Plain text (click to zoom on mobile):</p>
                    <Image
                        src={productCSVPlainTextImage}
                        alt='product csv file sample plain text'
                    />
                    <p>Spreadsheet (click to zoom on mobile):</p>
                    <Image
                        src={productCSVSpreadSheetImage}
                        alt='product csv file sample spreadsheet'
                    />
                </div>
                <div>
                    <p>2. Sales record CSV file sample:</p>
                    <p>Plain text:</p>
                    <Image
                        src={salesRecordCSVPlainTextImage}
                        alt='sales record csv file sample'
                    />
                    <p>Spreadsheet:</p>
                    <Image
                        src={salesRecordCSVSpreadShetImage}
                        alt='sales record csv file sample spreadsheet'
                    />
                </div>
            </div>
            <p>The sample file contains example products or sales records. Your import file will likely contain more products or sales records. If you use the sample file to create your own import file, then make sure that you remove
                all the example products or sales records.</p>

            <h2 id='csv-file-format'>CSV File Format</h2>
            <h3>Header</h3>
            <p>The first row of your product CSV file must be the column headers that are included in the sample CSV file and in the same order. Each column must be separated by a comma.</p>

            <HighlightParagraph
                type='warning'
                title='Important'
            >
                <p>The values or names of the <b>header columns</b> must be exactly the same as the values in the sample file. These are used to compare and match details in the application, therefore do not edit them, change them
                    into lowercase or uppercase, or add spaces or any other characters.</p>
            </HighlightParagraph>

            <h3>Rows</h3>
            <p>The following lines (or records) after the header row in the file must contain data for your product or sales record using the same columns in that exact same order. Every row in the CSV file after the header row is treated as a new product or sales record, depending on what you're importing.</p>

            <HighlightParagraph
                type='info'
                title='Note'
            >
                <p>If you use Excel to edit your CSV, then check Excel's export settings when you download the CSV to ensure your file uses commas between values.</p>
            </HighlightParagraph>

            <h2 id='product-csv-description'>Description of the Product Import CSV File</h2>
            <Table
                dataSource={productTableData}
                columns={tableColumns}
                pagination={false}
            />

            <h2 id='sales-record-csv-description'>Description of the Sales Record Import CSV File</h2>
            <Table
                dataSource={salesRecordTableData}
                columns={tableColumns}
                pagination={false}
            />
        </div>
    );
}

export default Csv;