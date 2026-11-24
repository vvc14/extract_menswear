import { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";

const CHARTS = {
    shirts: {
        label: "Shirts",
        cols: [["chest", "Chest"], ["body", "Length"], ["shoulder", "Shoulder"], ["sleeve", "Sleeve"]],
        rows: [
            { size: "S", chest: "36", body: "26", shoulder: "16.5", sleeve: "24" },
            { size: "M", chest: "38", body: "27", shoulder: "17", sleeve: "24.5" },
            { size: "L", chest: "40", body: "28", shoulder: "17.5", sleeve: "25" },
            { size: "XL", chest: "42", body: "29", shoulder: "18", sleeve: "25.5" },
            { size: "XXL", chest: "44", body: "30", shoulder: "18.5", sleeve: "26" },
        ],
        rack: "/shirts",
    },
    trousers: {
        label: "Trousers",
        cols: [["waist", "Waist"], ["hip", "Hip"], ["length", "Length"], ["inseam", "Inseam"]],
        rows: [
            { size: "28", waist: "28", hip: "36", length: "40", inseam: "30" },
            { size: "30", waist: "30", hip: "38", length: "41", inseam: "31" },
            { size: "32", waist: "32", hip: "40", length: "42", inseam: "32" },
            { size: "34", waist: "34", hip: "42", length: "42", inseam: "32" },
            { size: "36", waist: "36", hip: "44", length: "43", inseam: "32" },
            { size: "38", waist: "38", hip: "46", length: "43", inseam: "32" },
        ],
        rack: "/trousers",
    },
};

const MEASURE_TIPS = [
    { title: "Chest", body: "Around the fullest part of your chest, tape snug under the armpits." },
    { title: "Waist", body: "Around your natural waist, the narrowest part, just above the navel." },
    { title: "Shoulder", body: "Edge to edge across the back, keeping the tape flat." },
    { title: "Hip", body: "Around the fullest part of the hips, feet together, tape level with the floor." },
];

export default function SizeGuide() {
    const [active, setActive] = useState("shirts");
    const chart = CHARTS[active];

    return (
        <main id="main-content">
            <PageHero title="Size guide" kicker="Measured in inches" footer={<div className="tape" aria-hidden="true" />}>
                Between two sizes? Go one up for a relaxed fit, one down for a slim one.
            </PageHero>

            <div className="page-wrap py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <section aria-labelledby="chart-heading" className="lg:col-span-8">
                    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                        <h2 id="chart-heading" className="display text-[34px] sm:text-[44px] text-slate-900 dark:text-white">{chart.label} chart</h2>
                        <div className="inline-flex border-2 border-ink dark:border-slate-600" role="group" aria-label="Choose a chart">
                            {Object.entries(CHARTS).map(([key, c]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setActive(key)}
                                    aria-pressed={active === key}
                                    className={`min-h-[44px] px-5 text-[15px] font-extrabold transition-colors ${active === key
                                        ? "bg-primary text-white dark:bg-sign dark:text-ink"
                                        : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                                    style={{ fontStretch: "110%" }}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-2 border-ink dark:border-slate-600 bg-white dark:bg-slate-900 shadow-[6px_6px_0_var(--hard-shadow)] overflow-x-auto">
                        <table className="w-full text-center min-w-[420px]">
                            <caption className="sr-only">{chart.label} measurements in inches</caption>
                            <thead>
                                <tr className="bg-ink text-white">
                                    <th scope="col" className="px-3 sm:px-6 py-4 text-[13px] sm:text-[14px] font-black uppercase">Size</th>
                                    {chart.cols.map(([, label]) => (
                                        <th key={label} scope="col" className="px-3 sm:px-6 py-4 text-[13px] sm:text-[14px] font-black uppercase">{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {chart.rows.map((row) => (
                                    <tr key={row.size} className="border-t-2 border-slate-200 dark:border-slate-700 hover:bg-sign/40 dark:hover:bg-slate-800">
                                        <th scope="row" className="px-3 sm:px-6 py-4">
                                            <span className="price-tag text-[16px] sm:text-[18px] min-w-[3rem] justify-center">{row.size}</span>
                                        </th>
                                        {chart.cols.map(([k]) => (
                                            <td key={k} className="px-3 sm:px-6 py-4 text-[16px] sm:text-[18px] font-bold tabular-nums text-slate-800 dark:text-slate-200">{row[k]}"</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-6 text-[15px] text-slate-600 dark:text-slate-400">
                        Found your size? <Link to={chart.rack} className="font-bold text-primary dark:text-sign underline underline-offset-4">Shop {chart.label.toLowerCase()}</Link>
                    </p>
                </section>

                <section aria-labelledby="measure-heading" className="lg:col-span-4">
                    <h2 id="measure-heading" className="display text-[30px] sm:text-[36px] text-slate-900 dark:text-white mb-6">How to measure</h2>
                    <ol className="flex flex-col">
                        {MEASURE_TIPS.map((tip, i) => (
                            <li key={tip.title} className="grid grid-cols-[3rem_1fr] gap-3 py-4 border-t-2 border-ink dark:border-slate-600 last:border-b-2">
                                <span className="h-10 flex items-center justify-center bg-sign text-ink border-2 border-ink text-[15px] font-black tabular-nums">{i + 1}</span>
                                <div>
                                    <h3 className="text-[17px] font-black text-slate-900 dark:text-white">{tip.title}</h3>
                                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{tip.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <p className="mt-6 text-[15px] text-slate-700 dark:text-slate-300">
                        Not sure? Call <a href="tel:+918184836764" className="font-black text-primary dark:text-sign underline underline-offset-4 whitespace-nowrap">81848 36764</a> and ask the counter.
                    </p>
                </section>
            </div>
        </main>
    );
}
