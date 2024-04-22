const clearAndApproachableDocumentation = [
  'Clear and approachable',
  'With decades of technical writing experience and a knowledge of supporting tools, we utilize a combination of diagrams, text, video, etc. to convey information as clearly and succintly as possible.'
]

const devopsServices = [
  {
    title: 'Infrastructure / environment development',
    body: 'With our "infrastructure as code" (IaC), we create elegant reproducable, iterable, testable, and supportable infrastructure.',
    more: {
      intro: 'Modern approaches to infrastructure development revolve primarily around an Infrastructure as Code (IaC) which tends to make infrastructure and operatinos more testable (and therefore robust), more accessible (and therefore more easily supported), and more recoverable.',
      list: [
        [
          'Cloud based infrastructure',
          'We develop modern, robust cloud based infrastructure for Google Cloud Platform (GCP), Amazon Web Services (AWS), and OpenStack.'
        ],
        ['Fully documented','There should be no mystery in your infrastructure.'],
        ['Integration testing','With IaC, we can spawn complete test environments for automated and manual testing.'],
        [
          'Versioned and recreatable',
          'Support post-mortems and achieve better compliance with versioned environments, allowing you to fully recreate historical systems.'
        ],
      ]
    }
  },
  {
    title: 'CI/CD development',
    body: "Let us help develop and optimize your CI/CD to enable more secure and robust operations while minimizing overhead and improving mean time to issue resultion (MTTR).",
    more: {
      intro: "A well integrated continuous integration and deployment (CI/CD) process helps improve consistency while maximizing developer productivity and improving overall software quality.",
      list: [
        [
          'Developer environments',
          'CI/CD starts with consistent developer builds that emulate—while remaining distinct from—the production environment.'
        ],
        ['Built-in code reviews','Automatically assign, alert, and require code reviews where applicable.'],
        ['Automated testing','Better ensure code quality with automated unit and integration testing.'],
        [
          'Evidence generation',
          'As a best practice, or when required by a compliance framework, the CI/CD process should generate human and machine readable records of actions and results.'
        ],
        ['A consistent deploy process','Minimize human error and missed steps with a consistent, automated process.']
      ]
    }
  },
  {
    title: 'Continuous operations',
    body: `When it's important that your services be available and performant at all times and under all conditions, Young Gunz said it best: "can't stop, won't stop".`,
    more: {
      intro: 'Continuous operations (CO) helps ensure that your services are available to clients and customers at all times.',
      list: [
        [
          'No single point of failure',
          "Ensure constant availability through 'no single point of failure' architecture and design that ensures that all components are redundant and recoverable."
        ],
        [
          'Horizontal scaling',
          "Whenever possible, critical system components with highly variable demand are implemented with horizontal scaling to simultaneously improve performance and reduce costs."
        ],
        [
          'Robust monitoring',
          'Comprehensive, robust monitoring is the key to identifying, and therefore, mitigating issues.'
        ]
      ]
    }
  },
  {
    title: 'System Runbook development',
    body: 'Facilitate disaster recovery, training, and system visibility by capturing all key processes in infrastructure and services deployment.',
    more: {
      intro: <>A System Runbook is <span style={{fontStyle: 'italic'}}>the</span> key operational document for any organization.</>,
      list: [
        [
          'Comes with the package',
          'When we do the develompent ourselves, we build the System Runbook as we develop the infrastructure and define the deploy processes.'
        ],
        [
          'Low impact development',
          "With our wide breadth of operational experience, we can work with your team to accurately capture key operatinoal processes—even if we didn't build the system ourselves—often with minimal input and with minimal disruption."
        ],
        [
          'Comprehensive',
          'Again, our understanding of operations in general helps us to identify and fill gaps in the System Runbook to better ensure a complete and comprehensive accounting.'
        ],
        clearAndApproachableDocumentation,
        [
          'Testing',
          'The final step is always to use the System Runbook to recreate an isolated copy of the system to identify and fill any last gaps.'
        ]
      ]
    }
  },
  {
    title: 'Incident Response Playbook development',
    body: 'Hopefully, nothing goes wrong, but if it does, having an Incident Response Playbook helps ensure you can deal with issues quickly and consistently.',
    more: {
      intro: 'Turn stress and chaos into collective calm with a robust Incident Response Playbook.',
      list: [
        [
          'Comes with the package',
          'When we do the develompent ourselves, we build out an Incident Response Playbook as we develop and define the infrastructure.'
        ],
        [
          'Low impact development',
          "With our operational and technical experience, we can often identify many potential issues and solutions with little to no input from your team. And for the rest, we can develop the formal instructions with minimal input, thus minimizing the impact on development and operatinos."
        ],
        [
          'Comprehensive',
          'Again, our experince in application development and operations helps us identify potential issues and thereby achieve something close to comprehensive coverage.'
        ],
        clearAndApproachableDocumentation,
        [
          'Testing',
          'After the initial draft of the Incident Response Playbook is complete, an periodically thereafter, the instructions therein are tested in an isolated test environment to ensure they are correct and complete.'
        ]
      ]
    }
  },
]

export default devopsServices