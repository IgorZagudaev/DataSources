import { getDataSourceMode, setMode, syncFromAPI, DataSourceMode } from '../store';
import { useState, useEffect } from 'react';

export function ModeSwitcher() {
  const [mode, setModeState] = useState<DataSourceMode>(getDataSourceMode());
  const [loading, setLoading] = useState(false);

  const handleModeChange = async (newMode: DataSourceMode) => {
    setLoading(true);
    setMode(newMode);
    setModeState(newMode);
    
    if (newMode === 'api') {
      await syncFromAPI();
    }
    
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Режим:</span>
      <button
        onClick={() => handleModeChange('local')}
        disabled={loading}
        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
          mode === 'local'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Локальный
      </button>
      <button
        onClick={() => handleModeChange('api')}
        disabled={loading}
        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
          mode === 'api'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        PostgreSQL
      </button>
      {loading && (
        <span className="text-sm text-gray-500">Загрузка...</span>
      )}
    </div>
  );
}
