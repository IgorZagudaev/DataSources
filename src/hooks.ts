import { useState, useEffect } from 'react';
import { getReports, subscribe, loadReports } from './store';
import { Report } from './types';

export function useReports(): Report[] {
  const [reports, setReports] = useState<Report[]>(getReports());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setReports(getReports());
    });
    return unsubscribe;
  }, []);

  return reports;
}
