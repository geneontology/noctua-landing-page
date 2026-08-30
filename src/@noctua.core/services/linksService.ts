import { ENVIRONMENT } from '../data/constants'

export const getBaristaApiUrl = (baristaToken: string): string => {
  const { globalBaristaLocation: baseUrl, globalMinervaDefinitionName: location } = ENVIRONMENT;

  const apiUrl = `${baseUrl}/api/${location}/m3Batch`;
  return baristaToken ? `${apiUrl}Privileged` : apiUrl;
};
