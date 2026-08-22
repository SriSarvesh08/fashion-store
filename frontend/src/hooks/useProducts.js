import { useState, useEffect } from 'react';
import { productsApi } from '../utils/api';

export default function useProducts(filters) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current: 1 });

  useEffect(() => {
    let isMounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productsApi.getAll(filters);
        if (isMounted) {
          setProducts(res.data.products || []);
          setPagination({
            total: res.data.total || 0,
            pages: res.data.pages || 1,
            current: res.data.current_page || 1
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.error || 'Failed to fetch products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce if there's a search term
    if (filters.search) {
      const timer = setTimeout(() => fetchProducts(), 400);
      return () => {
        clearTimeout(timer);
        isMounted = false;
      };
    } else {
      fetchProducts();
      return () => { isMounted = false; };
    }
  }, [JSON.stringify(filters)]); // Re-run when filters change

  return { products, loading, error, pagination };
}
