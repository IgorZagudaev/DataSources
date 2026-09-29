import { useSyncExternalStore } from 'react';
import { getReports, subscribe } from './store';

export function useReports() {
  return useSyncExternalStore(subscribe, getReports);
}
