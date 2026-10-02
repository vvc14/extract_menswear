import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext();

// confirm("Delete this?")                → Promise<boolean>
export function useConfirm() {
    return useContext(ConfirmContext).confirm;
}

// prompt({ title, message, label, placeholder, confirmLabel, cancelLabel })
//                                        → Promise<string | null>  (null when cancelled)
// In-app replacement for window.prompt, styled like the other dialogs.
export function usePrompt() {
    return useContext(ConfirmContext).prompt;
}

const CLOSED = { isOpen: false, mode: "confirm", message: "", options: {}, resolve: null };

export function ConfirmProvider({ children }) {
    const [state, setState] = useState(CLOSED);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef(null);

    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setState({ isOpen: true, mode: "confirm", message, options: {}, resolve });
        });
    }, []);

    const prompt = useCallback((options = {}) => {
        return new Promise((resolve) => {
            setInputValue(options.defaultValue || "");
            setState({ isOpen: true, mode: "prompt", message: options.message || "", options, resolve });
        });
    }, []);

    useEffect(() => {
        if (state.isOpen && state.mode === "prompt") setTimeout(() => inputRef.current?.focus(), 50);
    }, [state.isOpen, state.mode]);

    const close = (result) => {
        if (state.resolve) state.resolve(result);
        setState(CLOSED);
    };
    const handleConfirm = () => close(state.mode === "prompt" ? inputValue.trim() : true);
    const handleCancel = () => close(state.mode === "prompt" ? null : false);

    const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);
    const { options } = state;
    const isPrompt = state.mode === "prompt";

    return (
        <ConfirmContext.Provider value={value}>
            {children}
            <AnimatePresence>
                {state.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/70 cursor-pointer"
                            onClick={handleCancel}
                        />
                        <motion.form
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative z-10 p-6 text-center border border-slate-200 dark:border-slate-800"
                        >
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/30">
                                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                                {options.title || "Confirm Action"}
                            </h3>
                            {state.message && (
                                <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 mb-5">{state.message}</p>
                            )}
                            {isPrompt && (
                                <div className="text-left mb-6">
                                    {options.label && (
                                        <label htmlFor="confirm-dialog-input" className="block text-[13px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                                            {options.label}
                                        </label>
                                    )}
                                    <textarea
                                        id="confirm-dialog-input"
                                        ref={inputRef}
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={options.placeholder || ""}
                                        maxLength={options.maxLength || 500}
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-[15px] text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 justify-center">
                                <button type="button" onClick={handleCancel} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">
                                    {options.cancelLabel || "Cancel"}
                                </button>
                                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-600 shadow-sm shadow-rose-500/30 transition-all active:scale-[0.98]">
                                    {options.confirmLabel || "Confirm"}
                                </button>
                            </div>
                        </motion.form>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}
