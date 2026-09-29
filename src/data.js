// All site content lives here — edit this file to update the portfolio.

export const links = {
  email: 'adithyasankarmenon@gmail.com',
  phone: '+91 73563 18402',
  github: 'https://github.com/AdithyaSM31',
  linkedin: 'https://linkedin.com/in/adithya-sankar-menon/',
  resume: 'https://drive.google.com/file/d/1yuP-UEtukaR3q6Mqt6VxlV0LN3WggYz5/view?usp=drive_link',
};

// Featured projects — rendered as the stacked cards in "Selected work".
export const featured = [
  {
    id: 'kuber',
    title: 'Kuber',
    kicker: 'AI Money Mentor',
    category: 'AI · Fintech',
    img: '/img/kuber.webp',
    blurb:
      'An AI financial advisor that handles wealth planning, mutual-fund analysis, tax planning and forward projections, powered by Llama 3 on Groq.',
    specs: [
      ['Model', 'Llama 3 via Groq'],
      ['Stack', 'Next.js 16 · FastAPI · Supabase'],
      ['Ships as', 'Web app + Android (Capacitor)'],
    ],
    links: [
      ['Live', 'https://kuber-ai-money-mentor.vercel.app/'],
      ['GitHub', 'https://github.com/AdithyaSM31/Kuber---AI-Money-Mentor'],
      ['APK', 'https://github.com/AdithyaSM31/Kuber---AI-Money-Mentor/releases/tag/v1.0'],
    ],
  },
  {
    id: 'syncforge',
    title: 'SyncForge',
    kicker: 'Real-time collaborative code editor',
    category: 'Realtime · Dev tools',
    img: '/img/syncforge.webp',
    blurb:
      'A browser IDE with live multi-user editing, shared cursors and sandboxed code execution in Docker. Yjs CRDTs over WebSockets keep every edit conflict-free.',
    specs: [
      ['Sync', 'Yjs CRDT over Socket.io'],
      ['Stack', 'React 19 · TypeScript · Docker'],
      ['Ships as', 'Web app + Android (Capacitor)'],
    ],
    links: [
      ['Live', 'https://sync-forge-client.vercel.app/'],
      ['GitHub', 'https://github.com/AdithyaSM31/SyncForge'],
      ['APK', 'https://github.com/AdithyaSM31/SyncForge/releases/tag/v1.0'],
    ],
  },
  {
    id: 'qflow',
    title: 'QFlow',
    kicker: 'Algorithmic trading backtester',
    category: 'Quant · Distributed systems',
    img: '/img/qflow.webp',
    blurb:
      'A backtesting platform for trading strategies (MA crossover, RSI, Bollinger Bands). Backtests run as async Celery jobs and come back with PnL analytics across 19 risk metrics.',
    specs: [
      ['Analytics', '19 risk metrics per run'],
      ['Stack', 'FastAPI · TimescaleDB · Celery · Redis'],
      ['Ships as', 'Web app + Android (Capacitor)'],
    ],
    links: [
      ['Live', 'https://q-flow-neon.vercel.app/'],
      ['GitHub', 'https://github.com/AdithyaSM31/QFlow-Algorithmic-Trading-Strategy-Backtester'],
      ['APK', 'https://github.com/AdithyaSM31/QFlow-Algorithmic-Trading-Strategy-Backtester/releases/tag/v1.0'],
    ],
  },
  {
    id: 'drone',
    title: 'Autonomous Landing',
    kicker: 'Vision-guided drone landing',
    category: 'Robotics · Computer vision',
    img: '/img/drone.webp',
    blurb:
      'An autonomous landing pipeline: a Raspberry Pi 5 camera detects ArUco markers with OpenCV and steers a Pixhawk flight controller over MAVLink, tracking in real time.',
    specs: [
      ['Perception', 'OpenCV ArUco detection'],
      ['Hardware', 'Raspberry Pi 5 · Pixhawk'],
      ['Link', 'MAVLink telemetry'],
    ],
    links: [['GitHub', 'https://github.com/AdithyaSM31/Autonomous-Drone-Landing-ArUco-Marker-Detection-']],
  },
  {
    id: 'circuit',
    title: 'Circuit Stream',
    kicker: 'Formula 1 data analysis',
    category: 'Data · Realtime',
    img: '/img/circuit-stream.webp',
    blurb:
      'A broadcast-grade F1 analysis app in the browser. It combines low-latency telemetry, synced race control and lap-by-lap analysis in one dashboard.',
    specs: [
      ['Data', 'FastF1 · Pandas'],
      ['Stack', 'React · Flask'],
      ['Ships as', 'Web app + Android APK'],
    ],
    links: [
      ['Live', 'https://www.circuitstream.app/'],
      ['GitHub', 'https://github.com/AdithyaSM31/Circuit-Stream---F1-Data-Analysis'],
      ['APK', 'https://github.com/AdithyaSM31/Circuit-Stream---F1-Data-Analysis/releases/tag/v1.2'],
    ],
  },
  {
    id: 'ghost',
    title: 'Ghost Chat',
    kicker: 'Steganographic messenger',
    category: 'Security · Cryptography',
    img: '/img/ghost-chat.webp',
    blurb:
      'Hides AES-256 encrypted messages inside ordinary images with LSB steganography, so messages stay deniable and avoid metadata profiling. Runs on the web and as an offline Android app.',
    specs: [
      ['Crypto', 'AES-256-GCM'],
      ['Technique', 'LSB steganography'],
      ['Ships as', 'Web app + offline Android'],
    ],
    links: [
      ['Live', 'https://ghost-chat-invisible-messaging.vercel.app/'],
      ['GitHub', 'https://github.com/AdithyaSM31/Ghost-Chat-Steganographic-Messenger'],
      ['APK', 'https://github.com/AdithyaSM31/Ghost-Chat---Invisible-Messaging/releases/tag/v1.0'],
    ],
  },
];

// Everything else: the archive list. Hovering a row opens a card with its details and links.
const gh = (repo) => `https://github.com/AdithyaSM31/${repo}`;
export const archive = [
  {
    title: 'NeuronIQ',
    desc: 'Turns PDFs and slides into study tools',
    long: 'Upload PDFs or PowerPoints and get academic summaries, notes, interactive flashcards, quizzes and a context-aware tutoring chatbot.',
    tags: 'AI · EdTech',
    stack: ['React 18', 'Vite', 'Groq API', 'KaTeX', 'pdf.js'],
    img: '/img/neuroniq-sm.webp',
    links: [
      ['Live', 'https://neuron-iq-ai-learning-platform.vercel.app/'],
      ['GitHub', gh('NeuronIQ---AI-Learning-Platform')],
    ],
  },
  {
    title: 'DriveLegal',
    desc: 'Offline-first road-law assistant for India',
    long: 'An offline-first PWA with instant access to the Motor Vehicles Act, state-specific amendments, a RAG assistant and a precise challan calculator. Built for the Road Safety Hackathon 2026.',
    tags: 'AI · PWA',
    stack: ['PWA', 'FastAPI', 'Groq (RAG)', 'IndexedDB', 'Capacitor'],
    img: '/img/drivelegal-sm.webp',
    links: [
      ['Live', 'https://drivelegal-road-safety-hackathon-20.vercel.app/'],
      ['GitHub', gh('DriveLegal---Road-Safety-Hackathon-2026')],
      ['APK', gh('DriveLegal---Road-Safety-Hackathon-2026/releases')],
    ],
  },
  {
    title: 'TwinMind',
    desc: 'Real-time AI meeting copilot',
    long: 'Listens to live audio, transcribes it, surfaces contextual suggestions and answers follow-up questions using a rolling context window.',
    tags: 'AI · Audio',
    stack: ['React', 'Vite', 'Groq API', 'MediaRecorder'],
    img: '/img/twinmind-sm.webp',
    links: [
      ['Live', 'https://twin-mind-ai-copilot.vercel.app/'],
      ['GitHub', gh('TwinMind-AI-Copilot')],
    ],
  },
  {
    title: 'Aura',
    desc: 'Autonomous treasury analyst',
    long: 'Upload Excel files and get instant financial insights from virtual CFO and CEO agents, with charts and analysis.',
    tags: 'AI · Finance',
    stack: ['React 18', 'FastAPI', 'Chart.js', 'Pandas'],
    img: '/img/aura-sm.webp',
    links: [
      ['Live', 'https://aura-the-autonomus-treasury-analyst.vercel.app/'],
      ['GitHub', 'https://github.com/SoldierOp/Aura-The-Autonomus-Treasury-Analyst'],
      ['Demo', 'https://youtu.be/lXcp92sImMI'],
    ],
  },
  {
    title: 'FloatChart AI',
    desc: 'Natural-language ocean data intelligence',
    long: 'Ask questions of ARGO ocean float data in plain language, through an immersive ocean-themed 3D frontend.',
    tags: 'AI · Ocean data',
    stack: ['React 18', 'FastAPI', 'Three.js', 'Groq', 'PostgreSQL', 'ChromaDB'],
    img: '/img/floatchart-sm.webp',
    links: [
      ['Live', 'https://float-chart-ai.vercel.app/'],
      ['GitHub', gh('FloatChart-AI')],
    ],
  },
  {
    title: 'PhotoInsights',
    desc: 'Serverless AI photo library on AWS',
    long: 'Upload photos, get AI-generated tags from Amazon Rekognition, and search your library intelligently. Fully serverless.',
    tags: 'Cloud · AWS',
    stack: ['AWS Lambda', 'S3', 'DynamoDB', 'Rekognition', 'CloudFront'],
    img: '/img/photoinsights-sm.webp',
    links: [
      ['Live', 'https://d9qrjo3ggcl4l.cloudfront.net/'],
      ['GitHub', gh('PhotoInsights-AWS')],
    ],
  },
  {
    title: 'Order Processing System',
    desc: 'Event-driven e-commerce microservices',
    long: 'An order-processing system built from Spring Boot microservices on Apache Kafka and Spring Cloud, demonstrating event-driven architecture patterns.',
    tags: 'Backend · Java',
    stack: ['Java 17', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Redis'],
    img: '/img/order-system-sm.webp',
    links: [['GitHub', gh('Event-Driven-Order-Processing-System')]],
  },
  {
    title: 'GridShare',
    desc: 'Peer-to-peer solar energy marketplace',
    long: 'Lets homeowners with solar panels sell their excess electricity directly to neighbours through a blockchain-simulated marketplace.',
    tags: 'Web3 · Energy',
    stack: ['React 18', 'Node.js', 'MongoDB', 'Vite'],
    img: '/img/gridshare-sm.webp',
    links: [
      ['Live', 'https://grid-share-blockchain-energy-tradin.vercel.app/'],
      ['GitHub', gh('GridShare---Blockchain-Energy-Trading-Platform')],
    ],
  },
  {
    title: 'T-Zero',
    desc: 'Real-time space mission dashboard',
    long: 'Aggregates live data from different space agencies into one accessible mission dashboard.',
    tags: 'Space · Dashboard',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Capacitor'],
    img: '/img/t-zero-sm.webp',
    links: [
      ['Live', 'https://t-zero-space-mission-dashboard.vercel.app/'],
      ['GitHub', gh('T-Zero-Space-Mission-Dashboard')],
      ['APK', gh('T-Zero-Space-Mission-Dashboard/releases/tag/v1.0')],
    ],
  },
  {
    title: 'HouseHub',
    desc: 'Full-stack property rental platform',
    long: 'Property rental and management with authentication, listings, advanced search and filters, bookmarks, dashboards and real-time messaging.',
    tags: 'Full-stack',
    stack: ['React', 'Express', 'SQLite', 'JWT', 'Socket.IO'],
    img: '/img/househub-sm.webp',
    links: [
      ['Live', 'https://house-hub-delta.vercel.app/'],
      ['GitHub', gh('HouseHub')],
    ],
  },
  {
    title: 'Persona Document Analyzer',
    desc: 'Role-aware document intelligence agent',
    long: 'Reads a collection of documents like a human expert and ranks the most important information for a given role and objective.',
    tags: 'NLP · Python',
    stack: ['Python', 'PyMuPDF', 'Sentence Transformers', 'scikit-learn'],
    img: '/img/persona-sm.webp',
    links: [['GitHub', gh('Persona-Driven-AI-Document-Analyzer')]],
  },
  {
    title: 'RFID Verification Simulator',
    desc: 'Real-time package verification system',
    long: 'Simulates RFID package scanning with dual-mode product management and a verification dashboard.',
    tags: 'Simulation',
    stack: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
    img: '/img/rfid-sm.webp',
    links: [
      ['Live', 'https://rfid-package-verification-simulator.vercel.app/'],
      ['GitHub', gh('RFID-Package-Verification-Simulator')],
    ],
  },
  {
    title: 'Wall Calendar',
    desc: 'Interactive wall calendar',
    long: 'A minimalist, responsive wall calendar with zero-latency media and drag-and-drop notes.',
    tags: 'UI craft',
    stack: ['Next.js 15', 'React', 'CSS Modules', 'LocalStorage'],
    img: '/img/wall-calendar-sm.webp',
    links: [
      ['Live', 'https://wall-calendar-phi.vercel.app/'],
      ['GitHub', gh('Wall-Calendar')],
    ],
  },
  {
    title: 'Wi-Fi RC Car',
    desc: '4WD car driven from any browser',
    long: 'A 4WD RC car controlled from any device through a web interface hosted on its own NodeMCU Wi-Fi network.',
    tags: 'Robotics · IoT',
    stack: ['C++', 'JavaScript', 'NodeMCU', 'IoT'],
    img: '/img/rc-car-sm.webp',
    links: [],
  },
];

export const experience = [
  {
    org: 'AdConvergence',
    role: 'Software Engineer Intern',
    full: 'AdConvergence Mediatech Pvt Ltd',
    place: 'Bengaluru, Karnataka',
    date: 'May — Jul 2026',
    points: [
      'Eliminated 5 critical API 500 crashes across 15+ endpoints by fixing connection-pool exhaustion from stray Prisma clients and adding shared scheduling state maps.',
      'Refactored a fragmented API layer into one RESTful architecture and extended PostgreSQL/Prisma schemas for media-campaign dashboards.',
      'Wrote data-seeding scripts that load 150+ records across 12+ entity types, including RBAC configuration.',
      'Integrated an RTMP/HLS video player, rolled out Tailwind dark mode across 14+ components, and added Pino structured logging and SMTP automation.',
    ],
  },
  {
    org: 'AR/VR Club',
    role: 'Technical Lead Developer',
    full: 'Augmented & Virtual Reality Club, VIT Chennai',
    place: 'Chennai',
    date: 'Oct 2023 — May 2026',
    points: [
      'Led development of AR/VR applications and immersive experiences.',
      'Built interactive projects in Unreal Engine 5 and tried out new AR/VR tooling.',
    ],
  },
  {
    org: 'GSSoC ’25',
    role: 'Open-source Contributor',
    full: 'GirlScript Summer of Code 2025',
    place: 'Remote',
    date: 'Sep — Oct 2025',
    points: [
      'Contributed to open-source projects across web development and machine learning.',
      'Worked with maintainers and contributors worldwide, following engineering best practices.',
    ],
  },
  {
    org: 'Robotics Club',
    role: 'Project Team Member',
    full: 'Robotics Club, VIT Chennai',
    place: 'Chennai',
    date: 'Oct 2023 — Mar 2025',
    points: [
      'Built autonomous systems, IoT projects and robotic applications.',
      'Worked hands-on with Arduino, ROS and embedded systems.',
    ],
  },
  {
    org: 'Short Film Club',
    role: 'Editor',
    full: 'The Short Film Club (TSF), VIT Chennai',
    place: 'Chennai',
    date: 'Sep 2023 — May 2026',
    points: ['Edited, color-graded and handled post-production for the club’s short films.'],
  },
];

export const skills = [
  { group: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C++', 'C', 'SQL', 'R', 'MATLAB', 'HTML / CSS'] },
  { group: 'Frameworks', items: ['React', 'Next.js', 'Node.js', 'Express', 'FastAPI', 'Flask', 'Spring Boot', 'Three.js', 'Tailwind CSS', 'Framer Motion'] },
  { group: 'AI & Data', items: ['scikit-learn', 'LangChain', 'sentence-transformers', 'Pandas', 'OpenCV', 'Groq / Llama', 'RAG pipelines', 'ChromaDB'] },
  { group: 'Data stores', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Firebase', 'DynamoDB', 'Redis', 'TimescaleDB'] },
  { group: 'Infra & tools', items: ['AWS', 'Docker', 'Kubernetes', 'Kafka', 'Jenkins · CI/CD', 'Git', 'Linux', 'ROS', 'Arduino', 'Unreal Engine 5'] },
];

export const marquee = ['Python', 'TypeScript', 'React', 'Next.js', 'FastAPI', 'AWS', 'Docker', 'Three.js', 'ROS', 'OpenCV', 'Kafka', 'PostgreSQL', 'LangChain', 'Kubernetes'];

export const education = [
  { school: 'Vellore Institute of Technology, Chennai', degree: 'B.Tech Computer Science — specialisation in AI & Robotics', score: 'CGPA 8.66', year: 'Present' },
  { school: 'Bhavan’s Vidya Mandir, Elamakkara', degree: 'CBSE Class XII', score: '95.4%', year: '2022' },
  { school: 'Talent Public School, Kerala', degree: 'CBSE Class X', score: '98%', year: '2020' },
];

export const certs = [
  { name: 'AWS Certified Solutions Architect — Associate', by: 'Amazon Web Services', date: 'SAA-C03', star: true },
  { name: 'OCI 2025 Certified Generative AI Professional', by: 'Oracle', date: '2025', star: true },
  { name: 'GitHub Foundations', by: 'GitHub', date: '' },
  { name: 'IBM Data Science Professional Certificate', by: 'IBM', date: 'Feb 2026' },
  { name: 'Applied Data Science Capstone', by: 'IBM', date: 'Feb 2026' },
  { name: 'Machine Learning with Python', by: 'IBM', date: 'Jan 2026' },
  { name: 'Software Engineering Job Simulation', by: 'JPMorgan Chase · Forage', date: 'Dec 2025' },
  { name: 'Microsoft Azure AI Essentials', by: 'Microsoft', date: 'Oct 2025' },
  { name: 'Docker Foundations Professional Certificate', by: 'Docker Inc.', date: 'Oct 2025' },
  { name: 'Network Support & Security', by: 'Cisco', date: 'Apr 2025' },
  { name: 'Data Analysis with Python', by: 'IBM', date: 'Feb 2025' },
  { name: 'Databases and SQL for Data Science', by: 'IBM · Coursera', date: '' },
  { name: 'Unreal Engine 5 C++ Game Development', by: 'Udemy', date: '' },
];
