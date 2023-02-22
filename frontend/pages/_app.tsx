import '../styles/globals.scss'
import '../styles/home.scss'
import '../styles/components/navbar.scss'
import '../styles/components/ballotCreation.scss'
import '../styles/components/ballots.scss'
import '../styles/components/forms.scss'
import '../styles/components/account.scss'
import '../styles/components/results.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import type { AppProps } from 'next/app'
import Layout from '../components/shared/layout'
import { UserProvider } from '../context/userState'
import Script from 'next/script'
import { BallotProvider } from '../context/ballotState'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script async src="https://www.googletagmanager.com/gtag/js?id=G-6TYX3TM1Z4" />
      <Script 
      id="gtag-init"
      strategy='afterInteractive'
      dangerouslySetInnerHTML={{
        __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6TYX3TM1Z4', {
              page_path: window.location.pathname
            });
      `}}/>
      <UserProvider>
        <BallotProvider>
          <Layout>
              <Component {...pageProps} />
          </Layout>
        </BallotProvider>
      </UserProvider>
    </>
  )
}

export default MyApp
