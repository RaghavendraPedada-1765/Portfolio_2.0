const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const preference = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch {} } };
const state = { lite: true, chapter: 0, scroll: 0, reduced: reducedMotion.matches, audio: false };
let world;
let toastTimeout;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 3400); }

const projects = [
  { name: "Edge-AI Smart Mirror", number: "01", category: "EDGE AI / IOT", tagline: "Intelligence that never leaves the device.", description: "My final-year project: a Raspberry Pi 4 smart mirror that detects mood and posture on the device itself, with no cloud and no internet connection.", stack: ["Python", "Raspberry Pi 4", "TensorFlow Lite", "MediaPipe", "OpenCV", "FastAPI"], flow: ["Camera + sensors", "On-device inference", "Mirror dashboard"], focus: "Real-time AI on a tight budget", detail: "Mood detection maps 7 facial expressions to 4 wellness states (93% accuracy) and MediaPipe BlazePose tracks 33 body landmarks for posture (89% accuracy), with under 50 ms inference on the Pi. A local FastAPI and WebSocket backend drives a high-contrast mirror dashboard, with a mock mode for development without hardware.", takeaway: "Squeezing models into latency and CPU budgets, designing a modular vision pipeline, and leading a 4-member team. Our IEEE conference paper on the system has been submitted to ICIPCN 2027.", url: "https://github.com/RaghavendraPedada-1765/Edge_AI_Smart_Mirror" },
  { name: "PaisaPilot", number: "02", category: "FINTECH / MOBILE", tagline: "A private, UPI-first expense tracker for India.", description: "An Android app that turns bank SMS alerts, Gmail card alerts and PDF statements into a clear picture of your spending, without your transactions ever leaving the phone.", stack: ["Flutter", "Dart", "SQLite (drift)", "Gmail API", "PDF parsing"], flow: ["SMS / Gmail / PDF", "Parse on device", "Categorised spending"], focus: "Privacy by design", detail: "PaisaPilot parses alert formats from several Indian banks and card issuers, merges duplicate alerts for the same payment, reads PDF statements on the phone and reconciles them against what the app has recorded. Everything lives in a local SQLite database, and spending is auto-categorised with rules you can override.", takeaway: "Building a mobile app around on-device data, writing robust parsers for messy real-world formats, and designing reconciliation so the numbers can be trusted.", url: "https://github.com/RaghavendraPedada-1765/PaisaPilot" },
  { name: "IFB Connect", number: "03", category: "ENTERPRISE / REAL-TIME", tagline: "Company chat that never leaves the company network.", description: "An on-premises Windows messaging platform built during my internship at IFB Automotive. All runtime traffic stays on the company LAN.", stack: ["C#", ".NET 8", "WinUI 3", "ASP.NET Core", "SignalR", "SQL Server"], flow: ["WinUI 3 client", "SignalR over LAN", "ASP.NET Core server"], focus: "Secure by default", detail: "Active Directory sign-in, direct messages, groups and department channels, presence, typing indicators and read receipts. File transfers are size- and type-restricted, antivirus-scanned and hash-verified. Messages queue for offline users, and administrators manage users, retention and announcements, with audit export.", takeaway: "Real-time systems with SignalR, security-first design for an internal network, and shipping software for real users in a company setting.", url: null, note: "Private company repository — source not public" },
  { name: "HashPilot", number: "04", category: "BLOCKCHAIN / PERFORMANCE", tagline: "Exploring the work behind proof of work.", description: "A full-stack platform that benchmarks Proof-of-Work strategies (sequential, random, multi-thread and multi-process) to compare their performance.", stack: ["Python", "FastAPI", "React", "SQLite", "Docker", "GitHub Actions"], flow: ["Mining strategy", "SHA-256 puzzles", "Benchmark analytics"], focus: "Making a computational concept tangible", detail: "A FastAPI backend runs benchmarks, stores results in SQLite and recommends strategies, while a React dashboard charts the performance and concurrency trade-offs. The project is containerised with Docker and tested through GitHub Actions CI/CD.", takeaway: "Owning the full lifecycle, from backend APIs and persistence to the dashboard, containers and CI/CD.", url: "https://github.com/RaghavendraPedada-1765/HashPilot" },
  { name: "Cosmic-RAG-System", number: "05", category: "ARTIFICIAL INTELLIGENCE / RAG", tagline: "Ask questions of your PDFs.", description: "A question-answering app over PDF documents using retrieval-augmented generation, with answers grounded in the retrieved passages.", stack: ["Python", "LangChain", "FAISS", "HuggingFace embeddings", "Groq"], flow: ["PDF", "Embed + FAISS search", "Grounded answer"], focus: "Knowledge before generation", detail: "Documents are embedded locally with HuggingFace models and indexed in FAISS. At question time the most relevant passages are retrieved and given to an LLM through Groq, which answers from them.", takeaway: "Building LLM integrations and retrieval pipelines with LangChain, and understanding how the quality of retrieved context shapes the usefulness of an answer.", url: "https://github.com/RaghavendraPedada-1765/Cosmic-RAG-System" },
  { name: "AQI IoT Station", number: "06", category: "IOT / CLOUD MESSAGING", tagline: "Air quality, end to end.", description: "A fully simulated Air Quality Index monitoring station: sensors to cloud broker to live dashboard, with no hardware required.", stack: ["Python", "MQTT", "HiveMQ Cloud", "Node-RED", "TLS"], flow: ["Sensor simulator", "MQTT over TLS", "Node-RED dashboard"], focus: "A full IoT pipeline", detail: "A Python simulator publishes temperature, humidity, CO₂ and PM2.5 readings over TLS-encrypted MQTT to HiveMQ Cloud. A Node-RED flow subscribes, computes AQI with the EPA breakpoint formula and shows it on a live dashboard.", takeaway: "Designing a multi-tier device → broker → dashboard architecture and working with secure cloud messaging.", url: "https://github.com/RaghavendraPedada-1765/AQI-IoT-Station" },
  { name: "AI Resume Analyzer", number: "07", category: "AI / NATURAL LANGUAGE PROCESSING", tagline: "How well does this résumé fit the job, and why?", description: "An ATS-style web app that scores PDF and DOCX résumés against a job description on 5 weighted dimensions.", stack: ["Python", "Streamlit", "Gemini API", "Groq", "spaCy", "Plotly"], flow: ["Résumé + job description", "LLMs + spaCy scoring", "Report"], focus: "Making feedback easier to act on", detail: "Two LLM engines (Gemini and Groq) evaluate the résumé alongside spaCy keyword extraction, and the results are shown as interactive Plotly charts with a JSON report export.", takeaway: "Combining LLM judgement with classic NLP, and turning analysis into feedback someone can act on.", url: "https://github.com/RaghavendraPedada-1765/AI_ATS_Checker" },
];
const stations = [
  { title: 'Build the whole ship.', copy: 'From interfaces to APIs, databases and mobile apps, I work across the application to turn ideas into working software.', tags: ['Python', 'C#', 'Dart', 'TypeScript', 'FastAPI', 'ASP.NET Core', 'React', 'Flutter', 'SQL Server', 'MySQL', 'SQLite'] },
  { title: 'Find meaning in the archives.', copy: 'Retrieval, language models and on-device vision: connecting people with useful information, even without the cloud.', tags: ['LangChain', 'RAG', 'FAISS', 'PyTorch', 'TensorFlow Lite', 'MediaPipe', 'OpenCV', 'spaCy'] },
  { title: 'Understand the system. Chart a course.', copy: 'A foundation in computer science and security, with tools to reason about systems and their behaviour.', tags: ['DSA', 'OOP', 'Operating systems', 'DBMS', 'Computer networks', 'Cryptography', 'SHA-256', 'Proof-of-Work'] },
  { title: 'Make ideas work in the real world.', copy: 'Connecting devices and shipping reliably: boards, sensors and brokers, plus the pipelines that test and deploy software.', tags: ['Raspberry Pi', 'ESP32', 'Arduino', 'MQTT', 'Node-RED', 'Docker', 'Kubernetes', 'OpenShift', 'GitHub Actions', 'pytest', 'Playwright'] },
];

function openDialog(dialog) { dialog.showModal(); document.body.style.overflow = 'hidden'; }
function closeDialog(dialog) { dialog.close(); document.body.style.overflow = ''; }
$$('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const b = dialog.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) closeDialog(dialog); } });
});
function showProject(index) {
  const p = projects[index];
  $('#project-content').innerHTML = `<span class="eyebrow">EXPEDITION ${p.number} / ${p.category}</span><h2 id="project-title">${p.name}</h2><p class="project-lead">${p.description}</p><div class="skill-tags">${p.stack.map(t => `<span>${t}</span>`).join('')}</div><div class="project-diagram" aria-label="Conceptual project flow">${p.flow.map((t, i) => `${i ? '<b aria-hidden="true">→</b>' : ''}<span>${t}</span>`).join('')}</div><div class="project-detail-grid"><div><h3>${p.focus}</h3><p>${p.detail}</p></div><div><h3>What this explores</h3><p>${p.takeaway}</p></div></div><div class="project-bottom">${p.url ? `<a class="primary-button" href="${p.url}" target="_blank" rel="noopener noreferrer">EXPLORE THE SOURCE <span>↗</span></a>` : `<span class="private-note">🔒 ${p.note}</span>`}<button class="line-link" id="next-project">Next island →</button></div>`;
  $('#next-project').addEventListener('click', () => { showProject((index + 1) % projects.length); $('#project-dialog').scrollTop = 0; });
  if (!$('#project-dialog').open) openDialog($('#project-dialog'));
}
$$('[data-project]').forEach(button => button.addEventListener('click', () => showProject(Number(button.dataset.project))));
$('#open-map').addEventListener('click', () => openDialog($('#map-dialog')));
$('#log-pose').addEventListener('click', () => openDialog($('#map-dialog')));
$$('.destination-list a').forEach(link => link.addEventListener('click', () => closeDialog($('#map-dialog'))));

function selectStation(index, focus = false) {
  const station = stations[index];
  $$('[data-station]').forEach((button, i) => { button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1; if (focus && i === index) button.focus(); });
  $('#skill-panel').setAttribute('aria-labelledby', `tab-${index}`);
  $('#skill-panel').innerHTML = `<div><h3>${station.title}</h3><p>${station.copy}</p></div><div class="skill-tags">${station.tags.map(t => `<span>${t}</span>`).join('')}</div>`;
}
$$('[data-station]').forEach(button => {
  button.addEventListener('click', () => selectStation(Number(button.dataset.station)));
  button.addEventListener('keydown', event => { const i = Number(button.dataset.station); if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); selectStation(event.key === 'Home' ? 0 : event.key === 'End' ? 3 : (i + (event.key === 'ArrowRight' ? 1 : 3)) % 4, true); } });
});
selectStation(0);

let scrollPending = false;
const chapters = $$('.chapter');
function updateScroll() {
  const probe = innerHeight * .45;
  let current = 0;
  chapters.forEach((section, i) => { if (section.getBoundingClientRect().top <= probe) current = i; });
  state.chapter = current;
  const section = chapters[current];
  state.scroll = current + Math.max(0, Math.min(1, -section.getBoundingClientRect().top / section.offsetHeight));
  $$('.voyage-rail a').forEach((a, i) => { a.classList.toggle('active', i === current); if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  $('.log-needle').style.transform = `rotate(${state.scroll * 63}deg)`;
  scrollPending = false;
}
addEventListener('scroll', () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
addEventListener('resize', updateScroll);
updateScroll();

// Lite is the text-first page; its 3D link opens the current cinematic experience.
function setLite() { state.lite = true; document.body.classList.add('lite'); }
setLite();

reducedMotion.addEventListener('change', event => { state.reduced = event.matches; world?.setReduced(event.matches); });

let audioContext, masterGain;
async function toggleAudio() {
  try {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContext(); masterGain = audioContext.createGain(); masterGain.gain.value = 0; masterGain.connect(audioContext.destination);
      const noise = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate);
      const data = noise.getChannelData(0); let previous = 0;
      for (let i = 0; i < data.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = previous * 5; }
      const source = audioContext.createBufferSource(); source.buffer = noise; source.loop = true;
      const filter = audioContext.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 750; source.connect(filter);
      const swell = audioContext.createGain(); swell.gain.value = .25; filter.connect(swell); swell.connect(masterGain);
      const lfo = audioContext.createOscillator(); lfo.frequency.value = .11; const lfoGain = audioContext.createGain(); lfoGain.gain.value = .11; lfo.connect(lfoGain); lfoGain.connect(swell.gain); lfo.start(); source.start();
      [130.81, 196, 261.63].forEach((frequency, i) => { const osc = audioContext.createOscillator(); osc.type = 'sine'; osc.frequency.value = frequency; const gain = audioContext.createGain(); gain.gain.value = .008 / (i + 1); osc.connect(gain); gain.connect(masterGain); osc.start(); });
    }
    await audioContext.resume(); state.audio = !state.audio;
    masterGain.gain.setTargetAtTime(state.audio ? .4 : 0, audioContext.currentTime, .3);
    $('#sound').setAttribute('aria-pressed', String(state.audio)); $('#sound').setAttribute('aria-label', state.audio ? 'Mute ocean ambience' : 'Enable ocean ambience'); $('#sound-label').textContent = state.audio ? 'SOUND ON' : 'SOUND OFF';
  } catch { toast('Audio is unavailable in this browser.'); }
}
$('#sound').addEventListener('click', toggleAudio);
document.addEventListener('visibilitychange', () => { if (audioContext) { if (document.hidden) audioContext.suspend(); else if (state.audio) audioContext.resume().catch(() => {}); } });
$('#copy-email').addEventListener('click', async () => { try { await navigator.clipboard.writeText('raghavendrapedadaa@gmail.com'); toast('Email address copied. Let’s build something.'); } catch { toast('Email: raghavendrapedadaa@gmail.com'); } });

// The Lite page does not load a WebGL scene.
