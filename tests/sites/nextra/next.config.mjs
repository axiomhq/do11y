import nextra from 'nextra';

const withNextra = nextra({ theme: 'nextra-theme-docs', defaultShowCopyCode: true, themeConfig: './theme.config.jsx' });
export default withNextra({ reactStrictMode: true });
