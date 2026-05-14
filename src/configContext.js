import { createContext, useContext } from 'react';
import staticConfig from '../config';

export function processConfig(raw) {
  return { ...raw };
}

export const ConfigContext = createContext(staticConfig);

export function useConfig() {
  return useContext(ConfigContext);
}
