import _ from 'lodash';
import parse from 'csv-parse';

import { ISaleItem, ISaleItemMutationInput } from './ImportSalesButton.props';
import { normalizeFile } from '../ImportProductButton/ImportProductButton.projections';

export const normalizeParsedData = (
    data: any[],
    errorCallback: (errors: string[]) => void,
    allProducts: any[]
): {
    previewTableData: ISaleItem[],
    mutationInputData: ISaleItemMutationInput[]
} | null => {
    const errorMessages: string[] = [];

    const tableData: ISaleItem[] = [];
    const mutationInputData: ISaleItemMutationInput[] = [];

    if (!_.isEmpty(data)) {
        let isValid = true;

        for (const entry of data) {
            const index = data.indexOf(entry);

            const tableDataEntry = { ...entry };
            const mutationInputDataEntry: ISaleItemMutationInput = {
                product: {
                    id: '',
                    name: '',
                    salePrice: '',
                    costPrice: ''
                },
                quantity: 0,
                salePrice: '',
                costPrice: ''
            };

            if (entry.quantity?.length < 1) {
                isValid = false;
                errorMessages.push(`Row ${index + 1} is missing a quantity which is required.`);
            }

            if (entry.sku?.length < 1) {
                isValid = false;
                errorMessages.push(`Row ${index + 1} is missing an sku which is required.`);
            } else {
                const product = _.find(allProducts, thisProduct => {
                    return thisProduct.sku == entry.sku.trim();
                });

                if (product) {
                    tableDataEntry.productId = product.id;
                    tableDataEntry.productName = product.name;
                    tableDataEntry.salePrice = product.salePrice;
                    mutationInputDataEntry.product.id = product.id;
                    mutationInputDataEntry.product.name = product.name;
                    mutationInputDataEntry.product.salePrice = product.salePrice;
                    mutationInputDataEntry.product.costPrice = product.salePrice;
                    mutationInputDataEntry.quantity = parseInt(entry.quantity);
                    mutationInputDataEntry.salePrice = product.salePrice;
                    mutationInputDataEntry.costPrice = product.costPrice;
                } else {
                    isValid = false;
                    errorMessages.push(`Row ${index + 1} sku (${entry.sku}) does not match any existing product in your database.`);
                }
            }
            
            tableData.push(tableDataEntry);
            mutationInputData.push(mutationInputDataEntry);
        }

        if (isValid) {
            return {
                previewTableData: tableData,
                mutationInputData
            };
        } else {
            errorCallback(errorMessages);
            return null;
        }
    } else {
        errorMessages.push('Minimum of one sale item is required. Please make sure you have at least one row (excluding header) in your csv file.');
        errorCallback(errorMessages);
        return null;
    }
}

export const columns = [
    {
        title: 'Product',
        dataIndex: 'productName'
    },
    {
        title: 'SKU',
        dataIndex: 'sku'
    },
    {
        title: 'Quantity',
        dataIndex: 'quantity'
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
                    columns: true
                },
                parserCallback
            );
        }
    };
    reader.readAsBinaryString(file);
};