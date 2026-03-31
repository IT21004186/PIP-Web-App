import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio } from '../api/portfolio';

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    staleTime: 1000 * 60 * 5,  // treat data as fresh for 5 minutes
    retry: 2,
  });
}
