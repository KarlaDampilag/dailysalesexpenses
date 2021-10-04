export interface ISaleItem {
    productId: string;
    productName: string;
    salePrice: string;
    sku: string;
    quantity: number;
}

interface ISaleItemProductInput {
    id: string;
    name: string;
    salePrice: string;
    costPrice: string;
}

export interface ISaleItemMutationInput {
    product: ISaleItemProductInput;
    quantity: number;
    salePrice: string;
    costPrice: string;
}