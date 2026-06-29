export const buildQueryString = (filters) => {
    const params = new URLSearchParams();

    if (filters.category) params.set("category", filters.category);
    if (filters.fabric?.length) params.set("fabric", filters.fabric.join(","));
    if (filters.style?.length) params.set("style", filters.style.join(","));
    if (filters.size?.length) params.set("size", filters.size.join(","));
    if (filters.minPrice != null && filters.minPrice > 0) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice != null && filters.maxPrice >= 0) params.set("maxPrice", filters.maxPrice);
    if (filters.sort) params.set("sort", filters.sort);

    return params.toString();
};
