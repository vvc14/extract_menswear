// The three price bands the shop talks in. Shared by the home page tags and the rack filters,
// so "Under ₹500" means the same thing everywhere. max is inclusive; null = no upper limit.
export const PRICE_BANDS = [
    { id: "under-500", label: "Under ₹500", short: "Under 500", min: 0, max: 499 },
    { id: "500-999", label: "₹500 to ₹999", short: "500 to 999", min: 500, max: 999 },
    { id: "1000-up", label: "₹1,000 and up", short: "1,000 +", min: 1000, max: null },
];

export const bandById = (id) => PRICE_BANDS.find((b) => b.id === id) || null;

export const inBand = (price, band) => price >= band.min && (band.max == null || price <= band.max);

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
