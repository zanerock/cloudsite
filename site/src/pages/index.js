import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import HomepageFeatures from '@site/src/components/HomepageFeatures'

import Heading from '@theme/Heading'
import styles from '@site/src/css/index.module.css'
import modalStyles from '@site/src/css/modal.module.css'

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <img src="/img/cloudsite-logo.svg" style={{paddingBottom: '1.5rem', maxWidth: '420px' }} />
        <div className={clsx('row')}>
          <h1 className="col col--8 col--offset-2" style={{borderBottom: 'none' }}>Easily and securely <span style={{color:'var(--ifm-color-content-secondary)'}}>host your own website</span> for <span style={{color:'var(--ifm-color-content-secondary)'}}>free</span>*</h1>
        </div>
        <div className={clsx('row')} style={{marginBottom: 'var(--ifm-spacing-vertical)'}}>
          <div className="hero__subtitle col col--8 col--offset-2"><span style={{color:'var(--ifm-color-content-secondary)'}}>*</span>: <Link to="#free-for-most">free for most</Link>; vastly reduced cost for the rest</div>
        </div>
        <div className={clsx('buttons_spaced')}>
          <Link
            key="/docs/quickstart"
            className={clsx('button', 'button--secondary button--lg')}
            to="/docs/quickstart">
            Quickstart
          </Link>
          <Link
            key="/docs/user-guides/command-line-reference"
            className={clsx('button', 'button--secondary button--lg')}
            to="/docs/user-guides/command-line-reference">
            Command Line Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Liquid Labs website.">
      <main>
        <HomepageHeader />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
