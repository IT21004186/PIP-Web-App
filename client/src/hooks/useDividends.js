import { useQuery } from '@tanstack/react-query';
import { fetchDividends } from '../api/crud';

export function useDividends() {
  return useQuery({
    queryKey: ['dividends'],
    queryFn:  fetchDividends,
    staleTime: 2 * 60 * 1000,
  });
}
