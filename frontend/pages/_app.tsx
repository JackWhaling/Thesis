import '../styles/globals.scss'
import '../styles/home.scss'
import '../styles/components/navbar.scss'
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
