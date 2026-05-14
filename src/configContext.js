import { createContext, useContext } from 'react';
import staticConfig from '../config';

export function processConfig(raw) {
  return {
    ...raw,
    reportTitleFormat: (number) => raw.reportTitleFormat.replace('{{number}}', number),
  };
}

export const ConfigContext = createContext(staticConfig);

export function useConfig() {
  return useContext(ConfigContext);
}
