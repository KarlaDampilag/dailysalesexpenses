export default interface IProduct {
    name: string,
    salePrice: number,
    costPrice?: number,
    sku?: string,
    categories?: string[],
    notes?: string
}