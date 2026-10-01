import React, { createContext, useContext, useState } from 'react';
import { setGlobalSalaryPrivacy, formatRupiah as rawFormatRupiah, terbilang as rawTerbilang } from '../utils/security';

interface SalaryPrivacyContextType {
  isSalaryHidden: boolean;
  setIsSalaryHidden: (hidden: boolean) => void;
  toggleSalaryPrivacy: () => void;
  formatRupiah: (amount: number, forceShow?: boolean) => string;
  terbilang: (amount: number, forceShow?: boolean) => string;
}

const SalaryPrivacyContext = createContext<SalaryPrivacyContextType | undefined>(undefined);

export const SalaryPrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default is true: All salary figures are hidden with *****
  const [isSalaryHidden, setIsSalaryHiddenState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sim_gaji_privacy_hidden');
      const initial = saved !== null ? saved === 'true' : true;
      setGlobalSalaryPrivacy(initial);
      return initial;
    } catch {
      setGlobalSalaryPrivacy(true);
      return true;
    }
  });

  const setIsSalaryHidden = (hidden: boolean) => {
    setGlobalSalaryPrivacy(hidden);
    try {
      localStorage.setItem('sim_gaji_privacy_hidden', String(hidden));
    } catch {
      // ignore
    }
    setIsSalaryHiddenState(hidden);
  };

  const toggleSalaryPrivacy = () => {
    const next = !isSalaryHidden;
    setGlobalSalaryPrivacy(next);
    try {
      localStorage.setItem('sim_gaji_privacy_hidden', String(next));
    } catch {
      // ignore
    }
    setIsSalaryHiddenState(next);
  };

  const formatRupiah = (amount: number, forceShow = false): string => {
    return rawFormatRupiah(amount, forceShow ? false : isSalaryHidden);
  };

  const terbilang = (amount: number, forceShow = false): string => {
    return rawTerbilang(amount, forceShow ? false : isSalaryHidden);
  };

  return (
    <SalaryPrivacyContext.Provider
      value={{
        isSalaryHidden,
        setIsSalaryHidden,
        toggleSalaryPrivacy,
        formatRupiah,
        terbilang,
      }}
    >
      {children}
    </SalaryPrivacyContext.Provider>
  );
};

export const useSalaryPrivacy = (): SalaryPrivacyContextType => {
  const context = useContext(SalaryPrivacyContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      isSalaryHidden: true,
      setIsSalaryHidden: () => {},
      toggleSalaryPrivacy: () => {},
      formatRupiah: (amount: number, forceShow?: boolean) => rawFormatRupiah(amount, forceShow ? false : true),
      terbilang: (amount: number, forceShow?: boolean) => rawTerbilang(amount, forceShow ? false : true),
    };
  }
  return context;
};

