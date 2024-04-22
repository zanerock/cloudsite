import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    id: "free-for-most",
    title: "Free (for most)",
    Svg: require('@site/static/img/no-cost-icon-bi-color.svg').default,
    description: (
      <>
        Cloudsite enables services on AWS. which offers a generous free tier. Beyond that, costs are very low compared to other options.
      </>
    ),
  },
  {
    title: "It's simple",
    Svg: require('@site/static/img/simple-icon-bi-color.svg').default,
    description: (
      <>
        Get up and running in just 4 simple steps.
      </>
    ),
  },
  {
    title: 'Secure',
    Svg: require('@site/static/img/secure-hosting-icon-bi-color.svg').default,
    description: (
      <>
        Leveraging AWS tools, your site is setup with protections against many of the most common attacks.
      </>
    ),
  },
  {
    title: 'Keep control',
    Svg: require('@site/static/img/ownership-icon-bi-color.svg').default,
    description: (
      <>
        Keep control of your site, your content, and let Cloudsite handle the details.
      </>
    ),
  }, 
]

function Feature({id, Svg, title, description, offset}) {
  return (
    <div id={id} className={clsx('col col--4', offset >  0 ? 'col--offset-' + offset : '')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        {FeatureList.reduce((acc, props, idx, arr) => {
          if (idx % 3 === 0) {
            const remainder = arr.length - idx
            let offset = 0
            if (remainder <= 3) {
              console.log('remainder:', remainder) // DEBUG
              offset = (12 - (remainder * 4)) / 2
            }
            props.offset = offset
            acc.push((
              <div key={idx + 'r'} className="row">
                {arr.slice(idx, idx + 3).map((props, idx2) => (
                  <Feature key={idx2 + idx} {...props} />
                ))}
              </div>
            ))
          }
          return acc
        }, [])}
      </div>
    </section>
  );
}
