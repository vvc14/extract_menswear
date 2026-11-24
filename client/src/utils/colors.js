// Swatch colours for the names admins type on products. A name not listed here still filters;
// it just gets a plain swatch with its first letter.
const SWATCHES = {
    black: "#1b1b1f", white: "#ffffff", "off white": "#f4f1e8", cream: "#f3e9d2", ivory: "#f6f1e1",
    grey: "#8a8d94", gray: "#8a8d94", charcoal: "#3b3e45", silver: "#c4c6cb",
    navy: "#1f2a52", "navy blue": "#1f2a52", blue: "#2f5fb3", "sky blue": "#8cc2ea", "light blue": "#a9cbea", teal: "#1f7a7a",
    green: "#2f7a43", olive: "#6b6b2e", "olive green": "#6b6b2e", mint: "#a8dcc0", "bottle green": "#0f4d32",
    red: "#b3362c", maroon: "#6b1f2a", wine: "#5c1a2b", burgundy: "#6b1f2a", pink: "#e79bb0", peach: "#f2b99a",
    orange: "#d9762b", rust: "#a6461f", yellow: "#f2cf3e", mustard: "#c99a2e",
    brown: "#6b4428", khaki: "#b8a57a", beige: "#d8c7a3", tan: "#c19a6b", camel: "#b5874f",
    purple: "#6a3d8f", lavender: "#b9a3d6", violet: "#7b4fa8",
};

export const swatchFor = (name) => SWATCHES[String(name || "").trim().toLowerCase()] || null;

// Dark swatches need a white tick, light ones an ink tick
export const isDarkSwatch = (hex) =>
    !!hex && parseInt(hex.slice(1, 3), 16) * 0.299 + parseInt(hex.slice(3, 5), 16) * 0.587 + parseInt(hex.slice(5, 7), 16) * 0.114 < 140;
