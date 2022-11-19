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
