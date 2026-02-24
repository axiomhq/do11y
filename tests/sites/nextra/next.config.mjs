import path from 'path';
import { fileURLToPath } from 'url';
import nextra from 'nextra';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextra = nextra({ theme: 'nextra-theme-docs', defaultShowCopyCode: true, themeConfig: './theme.config.jsx' });
export default withNextra({
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
});
