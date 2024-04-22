import Link from '@docusaurus/Link';

const securityAndComplianceServices = [
  { 
    title: 'Compliace program development', 
    body: "Whether it's an overhaul of your existing program, filling in gaps, or developing a program from the ground up, we can help.",
    more: {
      intro: "We cover all aspects of compliance program development for SOC 2, PCI DSS, HIPPA, NIST Cybersecurity Framework, etc.",
      list: [
        [
          (<Link to='./docs/security-and-compliance/policy-guide'>Policy creation</Link>),
          'Use or build off our 156 policy documents including standards, procedures, and guidelines.'],
        [
          'Systems monitoring',
          "Centralized logging configurations, ready made alarms, and continuous monitoring help surface any issues."
        ],
        ['Business continuity','Have plans in place to ensure smooth operation and control no matter what happens.'],
        [
          'Technology management',
          'Track technical dependencies to reduce vulnerabilities and keep everything up-to-date.'
        ],
        ['Device management', 'Simplify support and ensure laptops and mobile devices are up-to-date and secure.'],
        [
          'Risk assessment',
          'We provide pre-populated, guided assessments to help reduce attack surface and mitigate damage.'
        ],
        ['Physical security','We work with you to secure physical access to sensitive documents and digital data.'],
        [
          'Incident response', 
          'Have plans in place to address operational and legal ramifications when an incident occurs.'
        ],
        ['Disaster recovery','Be ready to bounce back from anything and eliminate single points of failure.'],
        ['Asset management','Ensure in-scope hardware is identified, hardened, and audited to avoid a breach.'],
        ['Change control','Auto-link changes to tickets, unit tests and other automatically generated evidence.'],
        ['Access management','Ensure consistent and auditable access for administrators, users, and service accounts.'],
        ['Training','Ensure that everyone knows the policy and receive all necessary role-specific tranings.'],
        [
          'Vulnerability management',
          'Automatically determine  relevance, classify, and address vulnerabilities in realtime.'
        ],
        ['Host hardening', 'Apply OSSEC standards and implement intrusion detection at the host level.'],
        [
          'Network hardening',
          'Lock the network down as required by your target compliance frameworks.'
        ],
        ['Application and service hardening','Whatever your stack, we can help you lock it down.'],
        ['Key management', 'Ensure access and security of operationally critical keys, certificates, etc.']
      ]
    }
  },
  { 
    title: 'Managed services', 
    body: 'We can provide or help source ongoing support and management for all new and existing services either directly or via supervised 3rd parties in a transparent, collaborative fashion.',
    more: {
      intro: 'Focus on your value add and let us take the rest off your plate.',
      list: [
        [
          'Security Event and Incident Management (SEIM)',
          'We can help source first-tier event analysis and mitigation.'
        ],
        [
          'Data backup management', 
          'Set your "minimal loss goals" and let us implement a plan; includes cloud and physicla data backups.'
        ],
        ['ASV scanning and pen tests', 'Offload periodic external testing.'],
        [
          'Host vulnerability management', 
          'Get continuous monitoring of NIST Common Vulnerability and Exposure alerts.'
        ],
        [
          'Internal audits', 
          "There's lots of thigs that need to be checked periodically and it's good to have a third-party check."
        ],
        [
          'Ongoing training',
          'Let us ensure that everyone is up to date on the latest policies and procedures.'
        ],
        ['Phishing testing','Ensure that your employees know not to click on random emails.']
      ]
    }
  },
  {
    title: 'Fractional CISO',
    body: "Pay for only as much as you need to get comprehensive executive planning and oversight of programs and operations.",
    more: {
      intro: "It's good to have someone stay on top of this security and compliance stuff.",
      list: [
        [
          'Strategic alignment',
          'We work with keystakeholders and oversee compliance requirements to make sure that you have everything you need '
        ],
        [
          'Risk assessments',
          'We specialize in qualitative STRIDE based assesments, and are also happy to work with any existing procedures or requirements.'
        ],
        [
          'Compliance and security vendor management',
          'From selection to contract negotiation to oversight, we offer complete vendor management.'
        ],
        [
          'Audit oversight',
          'Someones got to ensure that the required, periodic audits are being completed and done properly.'
        ],
        [
          'Improvement planning',
          'A good compliance system is unobtrusive and imposes minimal overhead. We help you engage in constant, iterative improvements.'
        ],
        [
          'Disaster recovery and incident response planning',
          'We ensure everything is up to date and ready if an unfortunate incident should occur.'
        ],
        [
          'Incident response',
          'When an incident occurs, we work with department heads to coordinate the legal, technical, and brand response.'
        ],
        [
          'Periodic drills and simualtions',
          'Make sure everyone is ready for when the real thing happens.'
        ]
      ]
    }
  },
]

export default securityAndComplianceServices