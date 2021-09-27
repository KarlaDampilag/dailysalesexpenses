import _ from 'lodash';
import parse from 'csv-parse';

import IProduct from './ImportProductButton.props';

export const normalizeFile = (event: any) => {
    if (event && event.target && event.target.files) {
        return event.target.files[0]
    }
};

export const normalizeParsedData = (data: any[], errorCallback: (errors: string[]) => void): IProduct[] => {
    const errorMessages: string[] = [];

    if (!_.isEmpty(data)) {
        let isValid = true;
        const products = _.map(data, (entry, key) => {
            const entryClone = { ...entry };

            if (entry.name.length < 1) {
                isValid = false;
                errorMessages.push(`Row ${key + 1} is missing a name which is required.`);

            }
            if (entry.salePrice.length < 1) {
                isValid = false;
                errorMessages.push(`Row ${key + 1} is missing a salePrice which is required.`);
            }

            if (entry.costPrice.length < 1) {
                entryClone.costPrice = null;
            }

            if (entry.sku.length < 1) {
                entryClone.sku = null;
            }

            if (entry.unit.length < 1) {
                entryClone.unit = null;
            }

            if (entry.categories.length < 1) {
                entryClone.categories = null;
            }

            if (entry.notes.length < 1) {
                entryClone.notes = null;
            }

            if (entry.categories.length > 0) {
                entryClone.categories = entry.categories.split(',');
            } else {
                entryClone.categories = null;
            }
            return entryClone;
        });

        if (isValid) {
            return products;
        } else {
            errorCallback(errorMessages);
            return [];
        }
    } else {
        errorMessages.push('Minimum of one product is required. Please make sure you have at least one product row in your csv file.');
        errorCallback(errorMessages);
        return [];
    }
}

export const columns = [
    {
        title: 'Name',
        dataIndex: 'name'
    },
    {
        title: 'Sale Price',
        dataIndex: 'salePrice'
    },
    {
        title: 'Cost Price',
        dataIndex: 'costPrice'
    },
    {
        title: 'SKU',
        dataIndex: 'sku'
    },{
        title: 'Unit',
        dataIndex: 'unit'
    },
    {
        title: 'Categories',
        dataIndex: 'categories',
        render: (value: string[]) => {
            if (!_.isEmpty(value)) {
                return value.join(', ');
            } else {
                return null;
            }
        }
    },
    {
        title: 'Notes',
        dataIndex: 'notes'
    }
];

export const handleFileUploadChange = (event: any, parserCallback: (error: any, output: any) => any) => {
    const file = normalizeFile(event);
    const reader = new FileReader();

    reader.onload = (e) => {
        if (e && e.target && e.target.result) {
            const bstr: string = e.target.result as string;
            parse(
                bstr,
                {
                    delimiter: ';',
                    columns: true
                },
                parserCallback
            );
        }
    };
    reader.readAsBinaryString(file);
};