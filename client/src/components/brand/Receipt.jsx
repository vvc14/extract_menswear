/**
 * The printed bill: zigzag-torn paper with a hard shadow. Used wherever money is summed up
 * (bag total, payment confirmation, order history) so totals always look like a shop bill.
 */
export default function Receipt({ as: Tag = "div", className = "", paperClassName = "", children, ...rest }) {
    return (
        <Tag className={`receipt-wrap ${className}`} {...rest}>
            <div className={`receipt text-slate-900 dark:text-white ${paperClassName}`}>{children}</div>
        </Tag>
    );
}

/** One line on the bill: label on the left, amount on the right. */
export function ReceiptLine({ label, value, strong = false, tone = "", className = "" }) {
    return (
        <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-[20px] font-black" : "text-[15px]"} ${className}`}>
            <dt className={strong ? "uppercase" : "text-slate-600 dark:text-slate-300"} style={strong ? { fontStretch: "115%" } : undefined}>{label}</dt>
            <dd className={`tabular-nums font-bold ${tone}`}>{value}</dd>
        </div>
    );
}

export function ReceiptRule() {
    return <hr className="receipt-rule" />;
}

/** Bill header: the shop's name and address, as printed at the top of every bill. */
export function ReceiptHead({ title = "Extract Menswear", sub = "NTR Road, Suraram Colony, Hyderabad" }) {
    return (
        <div className="text-center">
            <p className="text-[20px] font-black uppercase leading-none" style={{ fontStretch: "125%" }}>{title}</p>
            <p className="mt-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300">{sub}</p>
        </div>
    );
}
