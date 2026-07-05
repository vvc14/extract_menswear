                 import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmContext = createContext();

export function useConfirm() {
    return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }) {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        message: "",
        resolve: null
    });

    const confirm = useCallback((message) => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                message,
                resolve
            });
        });
    }, []);

    const handleConfirm = () => {
        if (confirmState.resolve) confirmState.resolve(true);
        setConfirmState({ isOpen: false, message: "", resolve: null });
    };

    const handleCancel = () => {
        if (confirmState.resolve) confirmState.resolve(false);
        setConfirmState({ isOpen: false, message: "", resolve: null });
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <AnimatePresence>
                {confirmState.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
                            onClick={handleCancel}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl overflow-hidden relative z-10 p-6 text-center border border-slate-200 dark:border-slate-800"
                        >
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/30">
                                <svg className="w-7 h-7 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 className="text-[20px] font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Confirm Action</h3>
                            <p className="text-[15px] font-medium text-slate-600 dark:text-slate-400 mb-6">{confirmState.message}</p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={handleCancel} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all active:scale-[0.98]">Cancel</button>
                                <button onClick={handleConfirm} className="flex-1 px-4 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 dark:bg-rose-500 dark:hover:bg-rose-600 shadow-sm shadow-rose-500/30 transition-all active:scale-[0.98]">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}
