import { useSyncExternalStore } from 'react';
import { getReports, getSaveState, subscribe } from './store';

export function useReports() {
  return useSyncExternalStore(subscribe, getReports);
}

// Состояние записи в БД: есть ли несохранённые изменения, идёт ли запись, текст ошибки
export function useSaveState() {
  return useSyncExternalStore(subscribe, getSaveState);
}
