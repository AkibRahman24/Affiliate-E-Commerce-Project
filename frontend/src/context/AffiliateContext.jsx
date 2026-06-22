import React, { createContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import affiliateService from '@/services/affiliate.service';

const STORAGE_KEY = 'affiliate_referrer';
const PRODUCT_KEY = 'affiliate_tracked_product';

export const AffiliateContext = createContext();

export const AffiliateProvider = ({ children }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [referrerCode, setReferrerCode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || null;
  });
  const [trackedProductId, setTrackedProductId] = useState(() => {
    return localStorage.getItem(PRODUCT_KEY) || null;
  });
  const trackedRef = useRef(null);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem(STORAGE_KEY, ref);
      setReferrerCode(ref);

      let productId = null;
      const match = location.pathname.match(/^\/products\/([^/]+)$/);
      if (match) {
        productId = match[1];
      }

      if (productId) {
        localStorage.setItem(PRODUCT_KEY, productId);
        setTrackedProductId(productId);
      }

      const key = `${ref}:${productId || ''}`;
      if (trackedRef.current !== key) {
        trackedRef.current = key;
        affiliateService.trackClick(ref, productId).catch((err) => console.error(err));
      }
    }
  }, [searchParams, location.pathname]);

  const clearReferrer = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PRODUCT_KEY);
    setReferrerCode(null);
    setTrackedProductId(null);
  }, []);

  const value = useMemo(() => ({ referrerCode, trackedProductId, clearReferrer }), [referrerCode, trackedProductId, clearReferrer]);

  return (
    <AffiliateContext.Provider value={value}>
      {children}
    </AffiliateContext.Provider>
  );
};
