import configData from './config.json';

const config = {
  ...configData,
  reportTitleFormat: (number) => configData.reportTitleFormat.replace('{{number}}', number),
};

export default config;
