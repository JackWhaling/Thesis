import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/shared/layout'
import { UserProvider } from '../context/userState'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <Layout>
          <Component {...pageProps} />
      </Layout>
    </UserProvider>
  )
}

export default MyApp
