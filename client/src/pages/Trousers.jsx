import CategoryListing from "../components/CategoryListing";

const CONFIG = {
    category: "trouser",
    path: "/trousers",
    title: "Trousers",
    plural: "trousers",
    blurb: "Formal, casual and slim fit. Pair them with anything from the shirt rack.",
    heroImage: "/images/site/trousers-hero.jpg",
    other: { to: "/shirts", label: "See the shirts rack" },
};

export default function Trousers() {
    return <CategoryListing config={CONFIG} />;
}
