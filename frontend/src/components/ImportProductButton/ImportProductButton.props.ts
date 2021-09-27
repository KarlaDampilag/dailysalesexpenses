export default interface IProduct {
    name: string,
    salePrice: number,
    costPrice?: number,
    sku?: string,
    unit?: string,
    categories?: string[],
    notes?: string
}