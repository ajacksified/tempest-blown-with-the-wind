import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    rules: {
      'react/jsx-filename-extension': [1, { extensions: ['.js'] }],
      // This project intentionally uses <img> — output is copy-pasted HTML for emails/websites
      '@next/next/no-img-element': 'off',
    },
  },
];
