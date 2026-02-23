import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="axiom-do11y-framework" content="nextra" />
        <meta name="axiom-do11y-debug" content="true" />
        <meta name="axiom-do11y-domains" content="localhost" />
        <script src="/do11y.js" defer />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
