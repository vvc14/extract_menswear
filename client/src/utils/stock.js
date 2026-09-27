// Mirrors server/utils/inventory.js: products with sizeStock track each size separately,
// legacy products share one `stock` across all sizes.
export const hasPerSizeStock = (product) => Array.isArray(product?.sizeStock) && product.sizeStock.length > 0;

export const stockForSize = (product, size) => {
    if (!product) return 0;
    if (hasPerSizeStock(product)) {
        const entry = product.sizeStock.find((s) => s.size === (size || ""));
        return entry ? Math.max(0, entry.stock) : 0;
    }
    return Math.max(0, product.stock || 0);
};
