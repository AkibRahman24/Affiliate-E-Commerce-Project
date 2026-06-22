import { useContext } from 'react';
import { AffiliateContext } from '@/context/AffiliateContext';

export const useAffiliate = () => {
  const context = useContext(AffiliateContext);
  if (!context) {
    throw new Error('useAffiliate must be used within AffiliateProvider');
  }
  return context;
};
