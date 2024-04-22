import Link from '@docusaurus/Link';

const commonDevelopmentServices = [
  [
    'Security first',
    (<>As evidenced by our <Link to='/security-and-compliance'>security and compliance services</Link> and decades of experience working in the financial sector, we employ a "security first" mindset.</>)
  ],
  [
    'Extensive documentation',
    "Don't get locked-in. We provide extensive high level and in-line documentation for more maintable code and to help new resources come up to speed and better avoid lock-in."
  ],
  [
    'Your stack of choice',
    "Though we are happy to provide recommendations, we're happy to work with any of a number of languages and framework to best support your in-house talent or preferences."
  ],
]

const guiServicesIntro = "With our collaborative and transparent development process, we ensure you get what you need and always know what you're getting."
const commonGUIServices = [
  ['Specification development and planning','Put a plan in place. See related service for details.'],
  [
    'Usable on day zero',
    'Avoid "black box development"; in most cases, we can launch a skeleton prototype on day zero, so you it\'s easy to see progress.'
  ],
  [
    'Iterative, milestone based development',
    'We break up the project into bite sized milestones for consistent, regular releases and updates as we move towards completion.'
  ],
  [
    'Shift left: testing and quality assurance',
    'We build out both automated and human scripted testing (as appropriate) alongside application implementation from the beginning.'
  ],
]

const softwareEngineeringServices = [
  {
    title: 'Specification development and planning',
    body: 'We work with business, marketing, service and all applicable stakeholders to organize, prioritize, and flesh out raw ideas into a concrete, actionable plan.',
    more : {
      intro: 'A complete, well engineer specification and/or plan is the first step in any significant development process.',
      list: [
        [
          'Identify purpose and differentiators',
          'Before enumerating concrete features, we must identify the purpose of the project and the ways in which it distinguishes itself from competitors and/or adjacent projects.'
        ],
        [
          'Enumerate key features',
          'A relatively complete list of concrete features is a necessary first step in building out the product roadmap and project planning.'
        ],
        [
          'Identify the MVP',
          'Getting a handle on the minimum viable product (MVP) focuses the project and helps establish time to market planning.'
        ],
        [
          'Organize features into cohesize milestones',
          'Starting with the MVP, we build out a series of milestone plans based on related features and dependencies to maxmize productivity and reduce time between the release of cohesive, robust product iterations.'
        ],
        [
          'Provide a complete picture',
          'More than "just a product specification", we provide a complete plan that encompasses not only product features, but operational concerns, the production environment, as well as any legal, regulatory, and other business concerns.'
        ],
        [
          'A keystone document',
          'A good product specification becomes a living document and resource for developers to help bring people up to speed and keep everyone on the same page.'
        ]
      ]
    }
  },
  {
    title: 'Mobile development',
    body: 'Go where the people are with mobile first development with iOS and Android applications.',
    more: {
      intro: guiServicesIntro,
      list: [
        ...commonGUIServices,
        ...commonDevelopmentServices,
        [
          'Unified and native implementations',
          'When possible, we use tools to create a common code-base across platforms to maximize productivity and minimize cost. Where necessary, we create native implementations.'
        ]
      ]
    }
  },
  {
    title: 'Webapp development',
    body: 'First impressions are key. Make it a good one with a modern, robust, sustainable, and beautifuly usable web applications.',
    more: {
      intro: guiServicesIntro,
      list: [
        ...commonGUIServices,
        ...commonDevelopmentServices,
        [
          'Mobile first development',
          'Your app should work on tiny screens too, so we start there and build out for better compatibility.'
        ]
      ]
    },
  },
  {
    title: 'Backnd API development',
    body: 'Capture your business in a modern, fault-tolerent, secure, and scalable cloud-based REST-ful backend.',
    more: {
      intro: 'The heart of your application is the business logic as implemented in the backend, which is no less important than the frontend components.',
      list: [
        [
          'REST-ful interfaces',
          'Except in rare cases, we expose backend logic through a modern REST-ful intterface for compatability and ease of use.'
        ],
        [
          'Cloud based implementation',
          'We implement you backend in a modern cloud based environment on Google Cloud Platform (GCP), Amazone Web Services (AWS), or OpenStack (unless special circumstances apply).'
        ],
        [
          'Scalable microservices',
          'We take a modern, robust, and scalable microservices approach to backend implemenation (unless special circumstances apply).'
        ],
        ...commonDevelopmentServices
      ]
    }
  },
  {
    title: 'Data architecture',
    body: 'From databases, to data warehouses and data lakes, we can provide high level architecture as well as low schemas.',
    more: {
      intro: 'Data storage, protection, and flow are all critical, interelated aspects of any system. We can help make sure it all works together and meets the business needs.',
      list: [
        [
          'System data architecture',
          'It all starts with a high level understanding of what data the system uses and how it uses it. System data architecture looks at the best methods and locations to store system data.'
        ],
        [
          'Schema design',
          'From full normalized SQL schemas to structured No-SQL, we can help define what data looks like, how it all relates, and better optimize search and retrieval.'
        ],
        [
          'Data flow design',
          'Understanding data processing pipelines and flows of data through the system is critical for both performance and security.'
        ]
      ]
    }
  }
]

export default softwareEngineeringServices