export const buildQueryString = (filters) => {
    const params = new URLSearchParams();

    if (filters.category) params.set("category", filters.category);
    if (filters.fabric?.length) params.set("fabric", filters.fabric.join(","));
    if (filters.style?.length) params.set("style", filters.style.join(","));
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

    return params.toString();
};
