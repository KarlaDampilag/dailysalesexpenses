import _ from 'lodash';

import IProduct from './ImportProductButton.props';

export const normalizeFile = (event: any) => {
    if (event && event.target && event.target.files) {
        return event.target.files[0]
    }
};

export const normalizeParsedData = (data: any[], errorCallback: (errors: string[]) => void): IProduct[] => {
    if (!_.isEmpty(data)) {
        let isValid = true;
        const errorMessages: string[] = [];
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
        return [];
    }
}