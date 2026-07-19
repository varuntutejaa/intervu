// Seeds 10 realistic tech job postings spanning every experience bracket
// (Fresher through 5-10 Years), each with a real company logo (via Google's
// public favicon service — logo.clearbit.com was shut down by HubSpot and
// no longer resolves) and a genuine, detailed description/responsibilities/
// qualifications rather than placeholder text. Safe to re-run — skips any
// (title, company) pair that already exists.
import "dotenv/config";
import { pool } from "../src/lib/db.js";

function logoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

// Nine months out from whenever this is run — far enough to not look stale.
function deadlineMonthsOut(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const JOBS = [
  {
    title: "Software Engineer Intern",
    company: "Google",
    domain: "google.com",
    location: "Bangalore, India",
    jobType: "Internship",
    workMode: "Hybrid",
    experience: "Fresher",
    salaryMin: 600000,
    salaryMax: 800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "C++", "Python", "Data Structures", "Algorithms"],
    description:
      "Join Google for a summer internship on one of our core product engineering teams. You'll ship real code that reaches real users, work alongside senior engineers, and get structured mentorship for the full duration of the internship.",
    responsibilities:
      "Design, build, and test features under the guidance of a dedicated host and mentor.\nParticipate in code reviews and design discussions as a full team member, not an observer.\nDebug issues in existing systems and contribute fixes with proper test coverage.\nPresent your summer project to the team at the end of the internship.\nLearn Google's engineering practices: code review culture, testing standards, and large-scale system design.",
    qualifications:
      "Currently pursuing a B.S./B.E. in Computer Science or a related field, graduating December 2027 or later.\nStrong foundation in data structures and algorithms, demonstrated through coursework or competitive programming.\nProficiency in at least one of Java, C++, or Python.\nAbility to work on-site in Bangalore at least 3 days a week for the internship duration.\nStrong communication skills and comfort asking questions in a large organization.",
  },
  {
    title: "Frontend Engineer",
    company: "Airbnb",
    domain: "airbnb.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "1-3 Years",
    salaryMin: 1800000,
    salaryMax: 2800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["React", "TypeScript", "GraphQL", "CSS", "Accessibility"],
    description:
      "Airbnb's Guest Experience team is looking for a frontend engineer to help build the search, discovery, and booking flows millions of guests use every day. You'll work in a React/TypeScript codebase with a strong design system and a high bar for performance and accessibility.",
    responsibilities:
      "Build and ship user-facing features across web and responsive surfaces in React and TypeScript.\nCollaborate closely with design and product to turn Figma specs into pixel-accurate, accessible components.\nWrite unit and integration tests for everything you ship — this team treats untested code as unfinished code.\nParticipate in a rotating on-call for the guest booking flow.\nContribute to Airbnb's shared component library used across multiple product teams.",
    qualifications:
      "1-3 years of professional experience building production web applications.\nStrong command of React, TypeScript, and modern CSS (flexbox/grid).\nExperience with GraphQL or a comparable typed API layer.\nAn eye for detail — you notice a 2px misalignment before it ships.\nComfortable working async across time zones on a distributed team.",
  },
  {
    title: "Backend Engineer, Payments Infrastructure",
    company: "Stripe",
    domain: "stripe.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 3500000,
    salaryMax: 5000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Go", "PostgreSQL", "Distributed Systems", "Kafka", "gRPC"],
    description:
      "Stripe's Payments Infrastructure team builds the systems that move money reliably at massive scale, across hundreds of currencies and payment methods. This role owns core ledger and reconciliation services where correctness isn't negotiable.",
    responsibilities:
      "Design and operate distributed backend services handling millions of financial transactions daily.\nWrite code where correctness, idempotency, and auditability are first-class design constraints, not afterthoughts.\nParticipate in incident response and blameless postmortems for a tier-0 payments system.\nImprove observability — metrics, tracing, and alerting — for the services you own.\nMentor engineers earlier in their careers on distributed systems fundamentals.",
    qualifications:
      "3-5 years of experience building backend services in a strongly-typed language (Go, Java, or similar).\nSolid understanding of relational databases, transactions, and consistency guarantees.\nExperience with distributed systems concepts: idempotency, eventual consistency, message queues.\nA track record of shipping and operating production systems, not just building demos.\nComfort working in a domain where a subtle bug has a direct financial cost.",
  },
  {
    title: "Site Reliability Engineer",
    company: "Netflix",
    domain: "netflix.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "5-10 Years",
    salaryMin: 5500000,
    salaryMax: 8000000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Kubernetes", "AWS", "Terraform", "Chaos Engineering", "Go"],
    description:
      "Netflix's streaming platform serves hundreds of millions of members worldwide. As an SRE on the Playback Infrastructure team, you'll be responsible for the reliability, scalability, and performance of the systems that keep streams playing without interruption.",
    responsibilities:
      "Own the reliability of critical streaming infrastructure services end to end.\nDesign and run chaos engineering experiments to find weaknesses before they become outages.\nBuild tooling and automation that reduces manual operational toil across the team.\nLead incident response for high-severity production issues, including writing detailed postmortems.\nPartner with product engineering teams to bake reliability into system design from day one, not bolt it on after launch.",
    qualifications:
      "5-10 years of experience in SRE, DevOps, or backend infrastructure roles at meaningful scale.\nDeep hands-on experience with Kubernetes and a major cloud provider (AWS preferred).\nProficiency with infrastructure-as-code (Terraform or equivalent).\nProven experience leading incident response for high-traffic production systems.\nStrong systems programming ability in Go, Java, or similar.",
  },
  {
    title: "Data Scientist",
    company: "Spotify",
    domain: "spotify.com",
    location: "Mumbai, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 3000000,
    salaryMax: 4500000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Python", "SQL", "A/B Testing", "Machine Learning", "Spark"],
    description:
      "Spotify's Personalization team uses data to help every listener discover music and podcasts they'll love. As a Data Scientist, you'll design experiments, build models, and influence product decisions that affect hundreds of millions of users.",
    responsibilities:
      "Design and analyze A/B tests for recommendation and discovery features.\nBuild and iterate on machine learning models that power personalized playlists and recommendations.\nPartner directly with product managers and engineers to translate business questions into data questions.\nCommunicate findings clearly to both technical and non-technical stakeholders.\nMaintain and improve the data pipelines your analyses depend on.",
    qualifications:
      "3-5 years of experience in a data science or applied ML role.\nStrong SQL and Python skills, including experience with pandas and scikit-learn or similar.\nSolid understanding of experimental design and statistical inference.\nExperience working with large-scale data processing tools (Spark or equivalent).\nAbility to communicate analytical results to a non-technical audience without losing the nuance.",
  },
  {
    title: "iOS Engineer",
    company: "Uber",
    domain: "uber.com",
    location: "Hyderabad, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "1-3 Years",
    salaryMin: 2000000,
    salaryMax: 3000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Swift", "SwiftUI", "iOS SDK", "REST APIs", "Unit Testing"],
    description:
      "Uber's Rider app team is hiring an iOS engineer to help build and maintain the app millions of riders use daily to get where they're going. You'll work across the full feature lifecycle, from design review to production rollout.",
    responsibilities:
      "Build new features in Swift/SwiftUI for the Uber Rider iOS app.\nWrite unit and UI tests to keep the app's large, high-traffic codebase reliable as it grows.\nParticipate in code review and help maintain engineering standards across the iOS codebase.\nDebug and fix production issues reported through crash analytics and user feedback.\nCollaborate with backend engineers to define and consume APIs for new features.",
    qualifications:
      "1-3 years of professional iOS development experience with Swift.\nFamiliarity with SwiftUI and modern iOS architecture patterns (MVVM or similar).\nExperience integrating REST APIs and handling asynchronous data flows.\nComfort writing unit tests and working in a codebase with an established test culture.\nA published app on the App Store (personal or professional) is a strong plus.",
  },
  {
    title: "Cloud Infrastructure Engineer",
    company: "Microsoft",
    domain: "microsoft.com",
    location: "Gurugram, India",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "5-10 Years",
    salaryMin: 5000000,
    salaryMax: 7500000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Azure", "Kubernetes", "Terraform", "CI/CD", "Networking"],
    description:
      "Microsoft Azure's Core Infrastructure team builds the foundational compute, networking, and storage platforms that power Azure itself and millions of customer workloads. This role owns infrastructure reliability and automation at global scale.",
    responsibilities:
      "Design and operate cloud infrastructure supporting Azure's global compute platform.\nBuild automation and self-service tooling that lets product teams provision infrastructure safely.\nDrive infrastructure-as-code adoption across teams still using manual provisioning.\nLead design reviews for major infrastructure changes, weighing reliability, cost, and security.\nParticipate in a global on-call rotation for platform-level incidents.",
    qualifications:
      "5-10 years of experience in cloud infrastructure, platform engineering, or DevOps roles.\nDeep expertise with a major cloud provider — Azure strongly preferred, AWS/GCP considered.\nStrong background in Kubernetes, container orchestration, and infrastructure-as-code.\nSolid understanding of networking fundamentals at a global, multi-region scale.\nExperience leading technical design discussions and mentoring other engineers.",
  },
  {
    title: "Machine Learning Engineer",
    company: "OpenAI",
    domain: "openai.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "3-5 Years",
    salaryMin: 4000000,
    salaryMax: 6000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Python", "PyTorch", "Distributed Training", "CUDA", "MLOps"],
    description:
      "Join a team building and deploying large-scale machine learning systems in production. You'll work on the infrastructure and tooling that makes it possible to train, evaluate, and serve models reliably at scale.",
    responsibilities:
      "Build and maintain distributed training pipelines for large machine learning models.\nOptimize model serving infrastructure for latency, throughput, and cost.\nCollaborate with research teams to productionize experimental models.\nDesign evaluation frameworks to catch regressions before they reach production.\nImprove tooling and observability across the ML training and serving stack.",
    qualifications:
      "3-5 years of experience building production machine learning systems.\nStrong Python skills and hands-on experience with PyTorch or a comparable framework.\nExperience with distributed training and GPU infrastructure.\nFamiliarity with MLOps practices — model versioning, monitoring, reproducibility.\nSolid software engineering fundamentals beyond notebook-level ML work.",
  },
  {
    title: "Full Stack Developer",
    company: "Shopify",
    domain: "shopify.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "1-3 Years",
    salaryMin: 1600000,
    salaryMax: 2400000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Ruby on Rails", "React", "GraphQL", "PostgreSQL"],
    description:
      "Shopify powers commerce for over a million businesses worldwide. As a full stack developer on the Merchant Admin team, you'll build tools merchants use every day to run their stores — from order management to analytics.",
    responsibilities:
      "Build full stack features spanning our Ruby on Rails backend and React frontend.\nWrite clean, well-tested code and participate actively in code review.\nWork directly with merchants (via support tickets and user research) to understand real pain points.\nShip incrementally — Shopify favors small, frequent deploys over big-bang releases.\nContribute to internal tooling that makes the whole team more productive.",
    qualifications:
      "1-3 years of full stack development experience.\nWorking knowledge of Ruby on Rails or a comparable server-side framework, plus React.\nComfort with relational databases and writing efficient SQL queries.\nA bias toward shipping — comfortable iterating in small, safe increments.\nGenuine curiosity about the merchants and businesses using what you build.",
  },
  {
    title: "Engineering Manager, Platform",
    company: "Amazon",
    domain: "amazon.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "5-10 Years",
    salaryMin: 7000000,
    salaryMax: 11000000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Leadership", "System Design", "Java", "AWS", "Agile"],
    description:
      "Amazon's Platform Engineering org is looking for an Engineering Manager to lead a team building shared infrastructure services used across dozens of internal product teams. You'll balance hands-on technical leadership with people management.",
    responsibilities:
      "Lead and grow a team of 6-10 backend engineers, including hiring, mentoring, and performance management.\nSet technical direction for platform services in collaboration with senior engineers and architects.\nPartner with product and other engineering teams to prioritize a shared infrastructure roadmap.\nStay hands-on enough to review key designs and unblock technical decisions.\nDrive operational excellence — on-call health, incident response quality, and system reliability — for your team's services.",
    qualifications:
      "5-10 years of software engineering experience, including 2+ years in a people management role.\nStrong system design background — comfortable reviewing designs for services at real scale.\nExperience with AWS or a comparable cloud platform, and Java or a similar backend language.\nA track record of growing engineers and building healthy, high-performing teams.\nComfortable balancing hands-on technical depth with the realities of people management.",
  },
  {
    title: "Backend Engineer, Ads Infrastructure",
    company: "Meta",
    domain: "meta.com",
    location: "Hyderabad, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "3-5 Years",
    salaryMin: 4200000,
    salaryMax: 6500000,
    discipline: "Engineering",
    travel: "None",
    skills: ["C++", "Python", "Distributed Systems", "Hack", "Thrift"],
    description:
      "Meta's Ads Infrastructure team builds the systems that serve billions of ad auctions a day across Facebook and Instagram. This role owns backend services where latency and throughput both matter at extreme scale.",
    responsibilities:
      "Design and build backend services for the ads serving and ranking pipeline.\nOptimize hot-path code for latency under real production load.\nParticipate in capacity planning for services handling billions of daily requests.\nWork with data scientists to productionize ranking model changes safely.\nDebug and resolve production issues across a large distributed system.",
    qualifications:
      "3-5 years of backend engineering experience, ideally at high-scale consumer products.\nStrong C++ or equivalent systems-level language experience.\nComfort with distributed systems concepts — RPC, caching, sharding.\nExperience working with large, unfamiliar codebases and navigating them independently.\nSolid CS fundamentals — algorithms, complexity, concurrency.",
  },
  {
    title: "Software Engineer, Platform",
    company: "Salesforce",
    domain: "salesforce.com",
    location: "Hyderabad, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1800000,
    salaryMax: 2800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Apex", "REST APIs", "MySQL", "Microservices"],
    description:
      "Salesforce's Core Platform team builds the multi-tenant infrastructure that every Salesforce cloud product runs on. You'll work on services that need to stay reliable for hundreds of thousands of enterprise customers at once.",
    responsibilities:
      "Build and maintain Java microservices that power core platform capabilities.\nWrite thorough unit and integration tests — platform changes ship to every customer at once.\nParticipate in code reviews and help uphold the team's engineering standards.\nInvestigate and fix production issues surfaced through monitoring and customer support escalations.\nDocument APIs and internal systems for other engineering teams to consume.",
    qualifications:
      "1-3 years of professional Java development experience.\nFamiliarity with REST API design and relational databases.\nExposure to multi-tenant or enterprise SaaS systems is a plus, not required.\nComfort working in a large, established codebase with strict release processes.\nStrong written communication — this team documents decisions, not just code.",
  },
  {
    title: "Frontend Engineer, Creative Cloud",
    company: "Adobe",
    domain: "adobe.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1700000,
    salaryMax: 2600000,
    discipline: "Engineering",
    travel: "None",
    skills: ["React", "TypeScript", "WebGL", "Canvas API", "Performance"],
    description:
      "Adobe's Creative Cloud web team builds browser-based creative tools used by millions of designers. This role focuses on the performance-critical rendering and editing surfaces of our web apps.",
    responsibilities:
      "Build interactive UI features in React and TypeScript for Creative Cloud web apps.\nOptimize rendering performance for canvas- and WebGL-heavy editing surfaces.\nCollaborate with design on pixel-precise, polished creative tooling.\nWrite tests for complex interactive components, not just simple forms.\nProfile and fix performance regressions before they reach production.",
    qualifications:
      "1-3 years of frontend engineering experience with React and TypeScript.\nExposure to canvas, WebGL, or other performance-sensitive rendering work is a strong plus.\nAn eye for visual detail and interaction polish.\nComfort profiling and debugging frontend performance issues.\nGenuine interest in creative/design tooling.",
  },
  {
    title: "Backend Engineer, Jira Cloud",
    company: "Atlassian",
    domain: "atlassian.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "3-5 Years",
    salaryMin: 3200000,
    salaryMax: 4800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Spring", "AWS", "Kafka", "Microservices"],
    description:
      "Atlassian's Jira Cloud platform team builds the backend services behind issue tracking and workflow automation used by hundreds of thousands of teams. You'll own services that need to scale from small teams to enterprise-wide deployments.",
    responsibilities:
      "Design and build Java microservices for core Jira Cloud workflows.\nEnsure services scale cleanly from small teams to tens of thousands of users per instance.\nParticipate in an on-call rotation for services you help own.\nWork cross-functionally with product to scope and estimate new features realistically.\nContribute to internal engineering standards and tooling.",
    qualifications:
      "3-5 years of backend engineering experience, Java/Spring preferred.\nExperience with AWS or a comparable cloud platform in production.\nComfort with asynchronous messaging systems (Kafka or similar).\nA track record of owning services end-to-end, including on-call.\nStrong collaboration skills across a fully distributed team.",
  },
  {
    title: "Data Engineer",
    company: "LinkedIn",
    domain: "linkedin.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 3500000,
    salaryMax: 5200000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Scala", "Spark", "Kafka", "Hadoop", "SQL"],
    description:
      "LinkedIn's Data Infrastructure team builds the pipelines that power everything from the People You May Know graph to feed ranking. This role owns large-scale batch and streaming data pipelines.",
    responsibilities:
      "Build and maintain large-scale batch and streaming data pipelines in Spark and Kafka.\nEnsure data quality and lineage across pipelines feeding downstream ML models.\nOptimize pipeline cost and runtime as data volume grows.\nPartner with data science teams to understand and unblock their pipeline needs.\nOn-call for pipeline health during business-critical windows.",
    qualifications:
      "3-5 years of data engineering experience with Spark and a JVM language (Scala or Java).\nExperience with streaming systems (Kafka or equivalent).\nSolid SQL skills and comfort with large-scale distributed data processing.\nUnderstanding of data quality and lineage concerns at scale.\nAbility to debug pipeline failures across many moving parts.",
  },
  {
    title: "SDE-1",
    company: "Flipkart",
    domain: "flipkart.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "Fresher",
    salaryMin: 900000,
    salaryMax: 1400000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Data Structures", "Algorithms", "SQL", "System Design"],
    description:
      "Flipkart's engineering teams build the systems behind India's largest e-commerce platform, from catalog and search to checkout and logistics. This SDE-1 role is a great entry point into backend engineering at scale.",
    responsibilities:
      "Build features under the guidance of senior engineers on a core commerce team.\nWrite clean, tested code and participate actively in code reviews.\nLearn to debug and operate services handling significant production traffic.\nContribute to design discussions for features you're building.\nGradually take on more ownership as you ramp up.",
    qualifications:
      "0-1 years of professional experience — new graduates welcome.\nStrong fundamentals in data structures, algorithms, and OOP.\nProficiency in Java or a comparable language.\nBasic understanding of SQL and relational databases.\nEagerness to learn production engineering practices fast.",
  },
  {
    title: "Backend Engineer, Logistics",
    company: "Swiggy",
    domain: "swiggy.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1600000,
    salaryMax: 2400000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Spring Boot", "MySQL", "Redis", "Microservices"],
    description:
      "Swiggy's Logistics team builds the systems that assign, route, and track delivery partners in real time across hundreds of cities. This role works on the order-to-delivery-partner matching engine.",
    responsibilities:
      "Build backend services for delivery partner assignment and real-time tracking.\nWrite code that performs well under sharp demand spikes (meal times, festivals).\nDebug production issues using logs, metrics, and traces.\nCollaborate with ops and product teams who depend on the systems you build.\nParticipate in code review and contribute to the team's engineering practices.",
    qualifications:
      "1-3 years of backend engineering experience, Java/Spring Boot preferred.\nExperience with relational databases and caching layers (Redis or similar).\nComfort working on systems with real-time, latency-sensitive requirements.\nAbility to debug production issues independently.\nInterest in logistics/operations-heavy problem spaces.",
  },
  {
    title: "Product Engineer",
    company: "Zomato",
    domain: "zomato.com",
    location: "Gurugram, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "Fresher",
    salaryMin: 800000,
    salaryMax: 1300000,
    discipline: "Engineering",
    travel: "None",
    skills: ["React", "Node.js", "JavaScript", "REST APIs", "Git"],
    description:
      "Zomato's Product Engineering team ships fast, end-to-end — from the customer app to the restaurant partner dashboard. As a Product Engineer, you'll own small features across the full stack from day one.",
    responsibilities:
      "Build full stack features spanning our Node.js backend and React frontend.\nShip small, frequent changes and iterate based on real user feedback.\nParticipate in on-call rotation once ramped up, with senior support.\nWork directly with product managers to scope features realistically.\nWrite tests for what you build — this team treats quality as part of shipping fast, not opposed to it.",
    qualifications:
      "0-1 years of professional experience — new graduates welcome.\nWorking knowledge of JavaScript, plus either React or Node.js from coursework or projects.\nComfort with Git and collaborative development workflows.\nA bias toward shipping and iterating quickly.\nGenuine curiosity about consumer product problems.",
  },
  {
    title: "Backend Engineer, Payments",
    company: "Razorpay",
    domain: "razorpay.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 3000000,
    salaryMax: 4500000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Golang", "PostgreSQL", "Kafka", "Microservices", "Redis"],
    description:
      "Razorpay processes payments for hundreds of thousands of Indian businesses. This role sits on the core payments team, building services where correctness and auditability are non-negotiable.",
    responsibilities:
      "Design and build backend services for payment processing and settlement flows.\nWrite code with strong idempotency and correctness guarantees — money is on the line.\nParticipate in incident response and postmortems for payments-critical services.\nImprove observability for the services your team owns.\nMentor junior engineers on distributed systems and payments domain knowledge.",
    qualifications:
      "3-5 years of backend engineering experience, Go preferred.\nSolid understanding of relational databases, transactions, and idempotency.\nExperience with message queues (Kafka or similar) in production.\nComfort working in a domain where correctness has direct financial impact.\nA track record of operating, not just building, production systems.",
  },
  {
    title: "Site Reliability Engineer",
    company: "PhonePe",
    domain: "phonepe.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "5-10 Years",
    salaryMin: 5500000,
    salaryMax: 8500000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Kubernetes", "AWS", "Prometheus", "Terraform", "Java"],
    description:
      "PhonePe handles billions of transactions a month across UPI, wallets, and financial services. As an SRE, you'll be responsible for the reliability of infrastructure that can't afford downtime.",
    responsibilities:
      "Own reliability for critical payments infrastructure serving hundreds of millions of users.\nBuild and improve monitoring, alerting, and incident response tooling.\nLead incident response for high-severity production issues, including detailed postmortems.\nDrive capacity planning ahead of high-traffic events (festivals, sales).\nPartner with engineering teams to bake reliability into system design from the start.",
    qualifications:
      "5-10 years of SRE, DevOps, or infrastructure engineering experience at meaningful scale.\nDeep hands-on experience with Kubernetes and a major cloud provider.\nProficiency with monitoring stacks (Prometheus/Grafana or similar) and infrastructure-as-code.\nProven experience leading incident response in a high-stakes environment.\nStrong systems programming background.",
  },
  {
    title: "Full Stack Engineer",
    company: "Freshworks",
    domain: "freshworks.com",
    location: "Chennai, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1400000,
    salaryMax: 2200000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Ruby on Rails", "React", "MySQL", "REST APIs"],
    description:
      "Freshworks builds customer engagement software used by tens of thousands of businesses worldwide. This role works on the Freshdesk support platform, across both backend and frontend.",
    responsibilities:
      "Build full stack features across our Rails backend and React frontend.\nWrite clean, tested code and participate in regular code reviews.\nWork with customer support and product teams to understand real user pain points.\nFix bugs reported by customers and verify fixes end to end.\nContribute to internal tooling that improves team velocity.",
    qualifications:
      "1-3 years of full stack development experience.\nWorking knowledge of Ruby on Rails or a comparable framework, plus React.\nComfort with relational databases and REST API design.\nGood written communication for working with distributed teams.\nA product-minded approach to engineering, not just ticket-closing.",
  },
  {
    title: "Software Engineer Intern",
    company: "Zoho",
    domain: "zoho.com",
    location: "Chennai, India",
    jobType: "Internship",
    workMode: "Onsite",
    experience: "Fresher",
    salaryMin: 400000,
    salaryMax: 600000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "JavaScript", "SQL", "Data Structures"],
    description:
      "Zoho builds a full suite of business software used by millions of companies, entirely self-funded and built in-house. As an intern, you'll work on a real product team from day one, not a side project.",
    responsibilities:
      "Build small features under the guidance of an experienced mentor.\nParticipate in code reviews and daily team standups.\nLearn Zoho's engineering practices across a large, mature in-house codebase.\nDebug and fix bugs in existing product features.\nPresent your internship project to the team at the end of the term.",
    qualifications:
      "Currently pursuing a B.E./B.Tech in Computer Science or a related field.\nStrong fundamentals in data structures and algorithms.\nProficiency in Java or JavaScript from coursework or personal projects.\nAbility to work on-site in Chennai for the internship duration.\nCuriosity about how a large, self-funded software company operates.",
  },
  {
    title: "Android Engineer",
    company: "Paytm",
    domain: "paytm.com",
    location: "Noida, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "1-3 Years",
    salaryMin: 1500000,
    salaryMax: 2300000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Kotlin", "Android SDK", "MVVM", "REST APIs", "Unit Testing"],
    description:
      "Paytm's consumer app is used by hundreds of millions of Indians for payments, banking, and financial services. This role builds features across the core Android app.",
    responsibilities:
      "Build new features in Kotlin for the Paytm consumer Android app.\nWrite unit and instrumentation tests for a large, high-traffic codebase.\nDebug production crashes and performance issues reported through analytics.\nCollaborate with backend engineers to define and consume APIs.\nParticipate in code review and help maintain Android engineering standards.",
    qualifications:
      "1-3 years of professional Android development experience with Kotlin.\nFamiliarity with MVVM or similar modern Android architecture patterns.\nExperience integrating REST APIs and handling asynchronous data flows.\nComfort writing tests and working in an established test culture.\nA published app on the Play Store (personal or professional) is a plus.",
  },
  {
    title: "Backend Engineer",
    company: "CRED",
    domain: "cred.club",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 3200000,
    salaryMax: 5000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Golang", "PostgreSQL", "gRPC", "Kubernetes", "Kafka"],
    description:
      "CRED builds financial products for India's most creditworthy members, with a strong bar for both engineering craft and product polish. This role builds backend services powering credit card bill payments and rewards.",
    responsibilities:
      "Design and build backend services in Go for payments and rewards features.\nWrite well-tested, well-documented code — this team values craft as much as speed.\nParticipate in design reviews before major changes ship.\nOwn services end-to-end, including monitoring and incident response.\nCollaborate closely with a small, high-context product and design team.",
    qualifications:
      "3-5 years of backend engineering experience, Go strongly preferred.\nSolid understanding of relational databases and distributed systems fundamentals.\nExperience with gRPC or similar typed RPC frameworks.\nA high bar for code quality and attention to detail.\nComfort working in a fast-moving, opinionated engineering culture.",
  },
  {
    title: "Software Engineer, API Platform",
    company: "Postman",
    domain: "postman.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1800000,
    salaryMax: 2800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Node.js", "TypeScript", "REST APIs", "MongoDB", "Electron"],
    description:
      "Postman is used by millions of developers to build and test APIs. This role works on the core API platform powering collection runs, mock servers, and API documentation.",
    responsibilities:
      "Build backend and platform features in Node.js and TypeScript.\nWork on developer-facing tooling used by millions of engineers worldwide.\nWrite tests and documentation to the same bar Postman expects from the APIs it helps build.\nDebug issues reported by a very technical, very vocal user base.\nCollaborate with product and design on a genuinely developer-first product.",
    qualifications:
      "1-3 years of backend or platform engineering experience.\nStrong Node.js and TypeScript skills.\nSolid understanding of REST API design and HTTP fundamentals.\nComfort working on a widely-used developer tool with a demanding user base.\nGenuine interest in developer experience and tooling.",
  },
  {
    title: "Frontend Engineer",
    company: "Figma",
    domain: "figma.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "3-5 Years",
    salaryMin: 4000000,
    salaryMax: 6200000,
    discipline: "Engineering",
    travel: "None",
    skills: ["TypeScript", "React", "WebGL", "Canvas", "Performance"],
    description:
      "Figma's design tool runs a real-time collaborative canvas rendering engine in the browser. This role works on the performance-critical editor surfaces used by millions of designers every day.",
    responsibilities:
      "Build and optimize interactive canvas-based UI in TypeScript and React.\nProfile and fix rendering performance issues in a demanding, real-time editor.\nCollaborate with design on interaction details that feel instant and precise.\nWrite tests for complex, stateful interactive components.\nContribute to shared infrastructure used across the editor codebase.",
    qualifications:
      "3-5 years of frontend engineering experience, ideally with canvas/WebGL work.\nStrong TypeScript and React skills.\nDemonstrated ability to profile and optimize frontend performance.\nAn eye for interaction polish and attention to detail.\nComfort working fully remote across time zones.",
  },
  {
    title: "Data Platform Engineer",
    company: "Databricks",
    domain: "databricks.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 4200000,
    salaryMax: 6500000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Scala", "Spark", "Delta Lake", "AWS", "Distributed Systems"],
    description:
      "Databricks builds the unified data and AI platform used by thousands of enterprises. This role works on the core Spark and Delta Lake engine that powers customer data pipelines at massive scale.",
    responsibilities:
      "Contribute to core distributed data processing engine features.\nOptimize query execution and storage layer performance.\nWrite thorough tests for changes that run in thousands of customer environments.\nDebug complex distributed systems issues reported by customers.\nParticipate in design discussions for major engine features.",
    qualifications:
      "3-5 years of experience with distributed data systems (Spark or comparable).\nStrong Scala or Java skills.\nSolid understanding of distributed systems fundamentals — consistency, fault tolerance.\nExperience with cloud storage systems (S3 or equivalent).\nComfort debugging issues across a large, complex distributed engine.",
  },
  {
    title: "Software Engineer, Query Processing",
    company: "Snowflake",
    domain: "snowflake.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "5-10 Years",
    salaryMin: 6000000,
    salaryMax: 9000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["C++", "Distributed Systems", "SQL", "Query Optimization"],
    description:
      "Snowflake's Query Processing team builds the engine that executes analytical queries across petabytes of customer data. This role works deep in the query optimizer and execution engine.",
    responsibilities:
      "Design and implement query optimization and execution engine features.\nImprove performance for analytical workloads across massive datasets.\nWrite extensive tests for changes that affect query correctness at scale.\nInvestigate customer-reported performance regressions and correctness issues.\nMentor engineers earlier in their careers on query engine internals.",
    qualifications:
      "5-10 years of experience building database or query engine internals.\nStrong C++ skills and deep CS fundamentals.\nUnderstanding of query optimization, execution plans, and distributed query processing.\nA track record of shipping performance-critical, correctness-sensitive systems.\nComfort working in a large, mature C++ codebase.",
  },
  {
    title: "Systems Engineer",
    company: "Cloudflare",
    domain: "cloudflare.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "3-5 Years",
    salaryMin: 3800000,
    salaryMax: 5800000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Rust", "Go", "Networking", "Linux", "Distributed Systems"],
    description:
      "Cloudflare runs one of the world's largest networks, handling a significant share of global internet traffic. This role works on edge systems that need to be fast, secure, and reliable at planetary scale.",
    responsibilities:
      "Build and maintain systems software running across Cloudflare's global edge network.\nWrite performance-critical code in Rust or Go with strong safety guarantees.\nDebug issues that manifest only at internet-scale traffic.\nParticipate in on-call for edge infrastructure services.\nCollaborate with security teams on hardening internet-facing systems.",
    qualifications:
      "3-5 years of systems engineering experience.\nStrong Rust or Go skills, with solid understanding of Linux networking internals.\nExperience with distributed systems operating at significant scale.\nComfort debugging issues with limited direct reproduction ability.\nGenuine interest in internet infrastructure and security.",
  },
  {
    title: "GPU Software Engineer",
    company: "Nvidia",
    domain: "nvidia.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "3-5 Years",
    salaryMin: 4500000,
    salaryMax: 7000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["CUDA", "C++", "Parallel Computing", "Performance Optimization"],
    description:
      "Nvidia's GPU compute software team builds the libraries and tooling that power everything from gaming to AI training. This role works on CUDA-accelerated compute libraries used across the industry.",
    responsibilities:
      "Develop and optimize CUDA kernels for compute-intensive workloads.\nProfile and improve performance across a range of GPU architectures.\nWrite thorough benchmarks and tests for library changes.\nCollaborate with hardware teams to understand new architecture capabilities.\nDocument APIs and performance characteristics for external developers.",
    qualifications:
      "3-5 years of experience with CUDA or GPU-accelerated computing.\nStrong C++ skills and understanding of parallel computing fundamentals.\nExperience profiling and optimizing compute-bound code.\nSolid grasp of computer architecture and memory hierarchies.\nA degree in Computer Science, Computer Engineering, or a related field.",
  },
  {
    title: "Software Developer",
    company: "IBM",
    domain: "ibm.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "Fresher",
    salaryMin: 700000,
    salaryMax: 1100000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "SQL", "REST APIs", "Data Structures"],
    description:
      "IBM's software teams build enterprise products spanning cloud, data, and AI. As a new graduate developer, you'll join a team building and maintaining production enterprise software.",
    responsibilities:
      "Build features under guidance on an established enterprise software product.\nWrite tested, documented code that meets enterprise reliability standards.\nParticipate in code reviews and structured onboarding for new engineers.\nLearn enterprise software development practices — change management, release cycles.\nGradually take on more independent ownership as you ramp up.",
    qualifications:
      "0-1 years of professional experience — new graduates welcome.\nStrong fundamentals in data structures, algorithms, and OOP.\nProficiency in Java from coursework or personal projects.\nBasic SQL and relational database knowledge.\nWillingness to work within established enterprise processes.",
  },
  {
    title: "Backend Developer",
    company: "SAP",
    domain: "sap.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1400000,
    salaryMax: 2200000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "ABAP", "SQL", "REST APIs", "SAP HANA"],
    description:
      "SAP builds enterprise resource planning software used by hundreds of thousands of businesses. This role works on backend services for SAP's cloud ERP platform.",
    responsibilities:
      "Build backend features in Java for SAP's cloud ERP products.\nWrite well-tested code that meets enterprise reliability and compliance standards.\nDebug issues reported by enterprise customers through support channels.\nCollaborate with product teams across multiple time zones.\nContribute to internal documentation and knowledge sharing.",
    qualifications:
      "1-3 years of backend development experience, Java preferred.\nFamiliarity with SQL and enterprise database systems.\nExposure to SAP HANA or similar enterprise database platforms is a plus.\nComfort working within structured, process-driven enterprise environments.\nGood written communication for cross-timezone collaboration.",
  },
  {
    title: "Cloud Engineer",
    company: "Oracle",
    domain: "oracle.com",
    location: "Hyderabad, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "1-3 Years",
    salaryMin: 1500000,
    salaryMax: 2300000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Oracle Cloud Infrastructure", "Terraform", "Linux"],
    description:
      "Oracle Cloud Infrastructure (OCI) is Oracle's cloud platform competing directly with AWS and Azure. This role works on core compute and storage services for OCI.",
    responsibilities:
      "Build and operate services for Oracle Cloud Infrastructure's compute platform.\nWrite infrastructure-as-code for provisioning and managing cloud resources.\nParticipate in testing and validation before major platform releases.\nDebug issues across compute, storage, and networking layers.\nCollaborate with senior engineers on service design decisions.",
    qualifications:
      "1-3 years of cloud or infrastructure engineering experience.\nWorking knowledge of Java and Linux systems administration.\nExposure to infrastructure-as-code tools (Terraform or similar).\nBasic understanding of cloud networking and storage concepts.\nWillingness to learn a large, established cloud platform codebase.",
  },
  {
    title: "Backend Engineer, Messaging",
    company: "Twilio",
    domain: "twilio.com",
    location: "Bangalore, India",
    jobType: "Contract",
    workMode: "Remote",
    experience: "3-5 Years",
    salaryMin: 3500000,
    salaryMax: 5000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Kafka", "AWS", "Microservices", "REST APIs"],
    description:
      "Twilio's messaging platform delivers billions of SMS, WhatsApp, and voice messages a month for businesses worldwide. This contract role works on message routing and delivery infrastructure.",
    responsibilities:
      "Build and maintain backend services for message routing and delivery.\nEnsure high throughput and reliability across a global messaging platform.\nInvestigate delivery failures and latency issues reported by customers.\nWork with carrier integration teams to troubleshoot routing edge cases.\nWrite thorough tests for changes to delivery-critical infrastructure.",
    qualifications:
      "3-5 years of backend engineering experience with high-throughput systems.\nExperience with Kafka or similar messaging/queueing systems.\nSolid AWS experience in production environments.\nComfort working as a contractor with a defined scope and timeline.\nAbility to ramp up quickly on an existing, complex codebase.",
  },
  {
    title: "Software Engineer, Developer Experience",
    company: "GitHub",
    domain: "github.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "3-5 Years",
    salaryMin: 4000000,
    salaryMax: 6000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Ruby", "Go", "REST APIs", "Git Internals"],
    description:
      "GitHub is the platform tens of millions of developers use every day. This role works on developer experience — the APIs, CLI, and tooling that make GitHub extensible.",
    responsibilities:
      "Build and maintain APIs and tooling used by GitHub's developer ecosystem.\nWrite documentation and examples to the same bar GitHub expects of open source projects.\nEngage with the developer community around API design decisions.\nDebug issues reported by developers building on top of GitHub's platform.\nContribute to internal and, where appropriate, open source tooling.",
    qualifications:
      "3-5 years of backend engineering experience, Ruby or Go preferred.\nStrong understanding of REST API design and developer-facing tooling.\nFamiliarity with Git internals is a strong plus.\nComfort working fully remote and asynchronously across time zones.\nGenuine care about developer experience, not just feature delivery.",
  },
  {
    title: "Infrastructure Engineer",
    company: "Dropbox",
    domain: "dropbox.com",
    location: "Remote (India)",
    jobType: "Full-time",
    workMode: "Remote",
    experience: "5-10 Years",
    salaryMin: 5800000,
    salaryMax: 8500000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Go", "Kubernetes", "Distributed Storage", "Linux"],
    description:
      "Dropbox stores and syncs exabytes of user data on its own custom-built infrastructure. This role works on the core storage and sync infrastructure that underpins the entire product.",
    responsibilities:
      "Design and operate infrastructure for large-scale distributed storage systems.\nImprove reliability and efficiency of sync infrastructure serving hundreds of millions of users.\nLead incident response for storage-critical infrastructure issues.\nDrive infrastructure-as-code and automation adoption across the team.\nMentor engineers on distributed storage systems fundamentals.",
    qualifications:
      "5-10 years of infrastructure or distributed systems engineering experience.\nStrong Go skills and deep Linux systems knowledge.\nExperience with distributed storage systems at meaningful scale.\nProven incident response leadership for critical infrastructure.\nComfort working fully remote with a high degree of autonomy.",
  },
  {
    title: "Backend Engineer",
    company: "Zoom",
    domain: "zoom.us",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1700000,
    salaryMax: 2600000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "WebRTC", "Microservices", "AWS"],
    description:
      "Zoom's platform handles millions of concurrent video meetings daily. This role works on backend services supporting meeting scheduling, account management, and platform APIs.",
    responsibilities:
      "Build backend services in Java supporting core meeting and account features.\nWrite tests for services that need to stay reliable under unpredictable load spikes.\nDebug production issues using logs, metrics, and distributed tracing.\nCollaborate with frontend and mobile teams consuming your APIs.\nParticipate in code review and team engineering practices.",
    qualifications:
      "1-3 years of backend engineering experience, Java preferred.\nFamiliarity with microservices architecture and REST APIs.\nExposure to real-time communication systems (WebRTC or similar) is a plus.\nComfort with AWS or a comparable cloud platform.\nAbility to debug issues under real production load.",
  },
  {
    title: "Frontend Engineer",
    company: "Myntra",
    domain: "myntra.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "Fresher",
    salaryMin: 850000,
    salaryMax: 1300000,
    discipline: "Engineering",
    travel: "None",
    skills: ["React", "JavaScript", "CSS", "REST APIs"],
    description:
      "Myntra is one of India's largest fashion e-commerce platforms. As a new graduate frontend engineer, you'll build features across the shopping and discovery experience.",
    responsibilities:
      "Build UI features in React under the guidance of senior engineers.\nTranslate design specs into responsive, accessible components.\nWrite tests for the components and features you build.\nParticipate in code review and learn the team's frontend engineering practices.\nFix bugs reported through QA and user feedback.",
    qualifications:
      "0-1 years of professional experience — new graduates welcome.\nWorking knowledge of JavaScript, React, and CSS from coursework or projects.\nBasic understanding of REST APIs and asynchronous data fetching.\nAn eye for UI detail and a willingness to iterate on feedback.\nEagerness to learn production frontend practices quickly.",
  },
  {
    title: "Backend Engineer",
    company: "Groww",
    domain: "groww.in",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1800000,
    salaryMax: 2700000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
    description:
      "Groww is one of India's largest investment platforms, covering stocks, mutual funds, and more. This role builds backend services for order execution and portfolio management.",
    responsibilities:
      "Build backend services in Java/Spring Boot for order execution and portfolio features.\nWrite code with strong correctness guarantees — this is financial data.\nDebug production issues across services handling real money movement.\nCollaborate with compliance and risk teams on regulatory requirements.\nParticipate in code review and on-call rotation.",
    qualifications:
      "1-3 years of backend engineering experience, Java/Spring Boot preferred.\nSolid understanding of relational databases and transactions.\nComfort working in a domain requiring high correctness and auditability.\nExposure to message queues (Kafka or similar) is a plus.\nInterest in fintech and capital markets.",
  },
  {
    title: "Software Engineer",
    company: "Zerodha",
    domain: "zerodha.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "3-5 Years",
    salaryMin: 2800000,
    salaryMax: 4200000,
    discipline: "Engineering",
    travel: "None",
    skills: ["Go", "PostgreSQL", "Systems Design", "Linux"],
    description:
      "Zerodha is India's largest stockbroker by trading volume, built and run by a lean, deliberately small engineering team. This role works across core trading platform systems.",
    responsibilities:
      "Build and maintain backend systems for order management and trading infrastructure.\nWrite efficient, well-tested Go code — this team runs lean and values craft.\nOwn systems end-to-end, from design through production operation.\nDebug issues directly, with minimal layers of process between you and the problem.\nContribute to a codebase built almost entirely in-house.",
    qualifications:
      "3-5 years of backend engineering experience, Go strongly preferred.\nStrong systems design fundamentals and comfort owning services end-to-end.\nExperience with relational databases at scale.\nA preference for lean, low-process engineering environments.\nInterest in financial markets and trading systems.",
  },
  {
    title: "Network Engineer",
    company: "Presidio",
    domain: "presidio.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "Fresher",
    salaryMin: 600000,
    salaryMax: 950000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Networking", "Cisco", "Routing & Switching", "TCP/IP"],
    description:
      "Presidio is a digital infrastructure and IT solutions provider helping enterprises modernize networking, cloud, and security. As a new graduate Network Engineer, you'll support and help design client network deployments.",
    responsibilities:
      "Assist in configuring and troubleshooting client network infrastructure.\nSupport senior engineers on network design and implementation projects.\nDocument network configurations and change procedures.\nLearn Presidio's delivery methodology across enterprise client engagements.\nParticipate in on-site client visits alongside senior team members.",
    qualifications:
      "0-1 years of professional experience — new graduates welcome.\nFoundational understanding of networking (TCP/IP, routing, switching).\nCCNA or equivalent coursework/certification is a strong plus.\nWillingness to travel for client engagements.\nStrong communication skills for client-facing work.",
  },
  {
    title: "Cloud Solutions Engineer",
    company: "Presidio",
    domain: "presidio.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "1-3 Years",
    salaryMin: 1400000,
    salaryMax: 2100000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["AWS", "Azure", "Terraform", "Cloud Migration"],
    description:
      "Presidio helps enterprise clients migrate to and operate on the cloud. This role works on client cloud migration and infrastructure modernization projects across AWS and Azure.",
    responsibilities:
      "Design and implement cloud infrastructure for enterprise client engagements.\nSupport cloud migration projects from planning through cutover.\nWrite infrastructure-as-code for repeatable, auditable deployments.\nTroubleshoot client cloud environment issues during and after migration.\nDocument architecture decisions for client and internal reference.",
    qualifications:
      "1-3 years of cloud engineering experience with AWS or Azure.\nExposure to infrastructure-as-code tools (Terraform or similar).\nBasic understanding of cloud migration patterns and challenges.\nComfort working directly with enterprise clients.\nA relevant cloud certification (AWS/Azure) is a plus.",
  },
  {
    title: "DevOps Engineer",
    company: "Presidio",
    domain: "presidio.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Hybrid",
    experience: "3-5 Years",
    salaryMin: 2600000,
    salaryMax: 4000000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Kubernetes", "CI/CD", "Terraform", "AWS", "Jenkins"],
    description:
      "This role builds and operates CI/CD and infrastructure automation for Presidio's managed services clients — enterprises that depend on Presidio to run and modernize their infrastructure.",
    responsibilities:
      "Design and maintain CI/CD pipelines for client infrastructure and application delivery.\nBuild infrastructure-as-code templates reused across multiple client engagements.\nAutomate manual operational processes to reduce client environment toil.\nTroubleshoot deployment and infrastructure issues across varied client environments.\nDocument runbooks and automation for handoff to managed services teams.",
    qualifications:
      "3-5 years of DevOps or infrastructure automation experience.\nHands-on experience with Kubernetes and a major cloud provider.\nStrong CI/CD tooling experience (Jenkins, GitHub Actions, or similar).\nComfort working across multiple, varied client environments simultaneously.\nGood client-facing communication skills.",
  },
  {
    title: "Cybersecurity Analyst",
    company: "Presidio",
    domain: "presidio.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "1-3 Years",
    salaryMin: 1300000,
    salaryMax: 2000000,
    discipline: "Engineering",
    travel: "None",
    skills: ["SIEM", "Threat Detection", "Network Security", "Incident Response"],
    description:
      "Presidio's security practice helps enterprise clients detect and respond to threats across their infrastructure. This role works within a security operations team monitoring client environments.",
    responsibilities:
      "Monitor client environments for security threats using SIEM tooling.\nInvestigate and triage security alerts, escalating incidents appropriately.\nAssist in incident response and post-incident reporting for client engagements.\nHelp maintain and tune detection rules to reduce false positives.\nDocument findings clearly for both technical and client-facing audiences.",
    qualifications:
      "1-3 years of experience in a security operations or analyst role.\nFamiliarity with SIEM platforms and common threat detection techniques.\nUnderstanding of network security fundamentals.\nSecurity certifications (Security+, CEH, or similar) are a plus.\nStrong attention to detail and clear incident documentation skills.",
  },
  {
    title: "Senior Systems Engineer",
    company: "Presidio",
    domain: "presidio.com",
    location: "Bangalore, India",
    jobType: "Full-time",
    workMode: "Onsite",
    experience: "5-10 Years",
    salaryMin: 4500000,
    salaryMax: 6800000,
    discipline: "Engineering",
    travel: "Up to 25%",
    skills: ["Systems Architecture", "VMware", "Storage", "Networking", "Leadership"],
    description:
      "This senior role leads systems architecture and delivery for Presidio's largest enterprise client engagements, spanning compute, storage, and networking modernization projects.",
    responsibilities:
      "Lead systems architecture design for major enterprise client engagements.\nMentor junior engineers on project delivery and technical execution.\nServe as the primary technical point of contact for key client relationships.\nReview and approve infrastructure designs before client implementation.\nStay current with evolving enterprise infrastructure technology to advise clients accurately.",
    qualifications:
      "5-10 years of enterprise systems engineering or infrastructure consulting experience.\nDeep expertise across compute, storage, and networking technologies.\nProven track record leading client-facing technical engagements.\nStrong mentorship and technical leadership experience.\nRelevant vendor certifications (VMware, Cisco, or similar) are a strong plus.",
  },
];

async function findOrSeedRecruiterSub(): Promise<string> {
  const existing = await pool.query<{ auth_sub: string }>(
    "SELECT auth_sub FROM profiles WHERE role = 'recruiter' LIMIT 1",
  );
  if (existing.rows[0]) return existing.rows[0].auth_sub;
  console.log("No recruiter account found — seeding jobs under a synthetic posted_by (no FK constraint on this column).");
  return "seed-script";
}

async function generateJobCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await pool.query("SELECT 1 FROM jobs WHERE job_code = $1", [code]);
    if (existing.rowCount === 0) return code;
  }
  throw new Error("Couldn't generate a unique job code.");
}

const postedBy = await findOrSeedRecruiterSub();
let inserted = 0;
let skipped = 0;

for (const job of JOBS) {
  const existing = await pool.query("SELECT 1 FROM jobs WHERE title = $1 AND company = $2", [
    job.title,
    job.company,
  ]);
  if ((existing.rowCount ?? 0) > 0) {
    skipped++;
    continue;
  }

  const jobCode = await generateJobCode();
  await pool.query(
    `INSERT INTO jobs (
       title, company, location, job_type, work_mode, experience,
       salary_min, salary_max, description, skills, application_deadline,
       job_code, posted_by, travel, discipline, responsibilities, qualifications, company_logo_url
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      job.title,
      job.company,
      job.location,
      job.jobType,
      job.workMode,
      job.experience,
      job.salaryMin,
      job.salaryMax,
      job.description,
      job.skills,
      deadlineMonthsOut(3),
      jobCode,
      postedBy,
      job.travel,
      job.discipline,
      job.responsibilities,
      job.qualifications,
      logoUrl(job.domain),
    ],
  );
  console.log(`Inserted: ${job.title} @ ${job.company} (#${jobCode})`);
  inserted++;
}

console.log(`\nDone. Inserted ${inserted}, skipped ${skipped} already-existing.`);
await pool.end();
