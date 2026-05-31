import { useQuery } from '@tanstack/react-query';
import { fetchInvestmentLogs } from '../api/crud';

export function useInvestmentLogs() {
  return useQuery({
    queryKey: ['investmentLogs'],
    queryFn:  fetchInvestmentLogs,
    staleTime: 2 * 60 * 1000,
  });
}
