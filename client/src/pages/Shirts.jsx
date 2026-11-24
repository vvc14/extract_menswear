import CategoryListing from "../components/CategoryListing";

const CONFIG = {
    category: "shirt",
    path: "/shirts",
    title: "Shirts",
    plural: "shirts",
    blurb: "Plain and checked, for the office, the function hall and the weekend. Every shirt on the rack, in one place.",
    heroImage: "/images/site/shirts-hero.jpg",
    other: { to: "/trousers", label: "See the trousers rack" },
};

export default function Shirts() {
    return <CategoryListing config={CONFIG} />;
}
