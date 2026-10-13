const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const preference = { get(key) { try { return localStorage.getItem(key); } catch { return null; } }, set(key, value) { try { localStorage.setItem(key, value); } catch {} } };
const state = { lite: true, chapter: 0, scroll: 0, reduced: reducedMotion.matches, audio: false };
let world;
let toastTimeout;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 3400); }

const projects = [
  { name: 'HashPilot', number: '01', category: 'BLOCKCHAIN / AI', tagline: 'Exploring the work behind proof of work.', description: 'An AI-powered blockchain puzzle-solving platform for exploring Proof-of-Work mining concepts through multiple strategies, benchmarking and performance analysis.', stack: ['Python', 'FastAPI', 'React', 'SHA-256', 'Blockchain'], flow: ['Mining strategy', 'SHA-256 puzzles', 'Benchmark results'], focus: 'Making a computational concept tangible', detail: 'HashPilot brings puzzle solving, strategy comparison and performance analysis into one application. It connects a React interface with a Python and FastAPI backend to make mining experiments easier to explore.', takeaway: 'Systems thinking across the frontend and backend, with a focus on making technical behaviour understandable through benchmarks and analysis.', url: 'https://github.com/RaghavendraPedada-1765/HashPilot' },
  { name: 'Cosmic-RAG-System', number: '02', category: 'ARTIFICIAL INTELLIGENCE / RAG', tagline: 'Connecting questions with useful context.', description: 'A Retrieval-Augmented Generation system using large language models and vector databases to produce contextual responses grounded in retrieved information.', stack: ['Python', 'LangChain', 'RAG', 'LLMs', 'Vector databases'], flow: ['Question', 'Retrieve context', 'Generate response'], focus: 'Knowledge before generation', detail: 'This project explores how retrieval and language models work together. Relevant information is retrieved from a vector database and provided as context for the model’s response.', takeaway: 'Building LLM integrations and retrieval pipelines, and understanding how the quality of retrieved context shapes the usefulness of an answer.', url: 'https://github.com/RaghavendraPedada-1765/Cosmic-RAG-System' },
  { name: 'AI ATS Checker', number: '03', category: 'AI / NATURAL LANGUAGE PROCESSING', tagline: 'Turning a job description into actionable feedback.', description: 'An AI-powered résumé analysis tool that evaluates résumés against job descriptions and provides practical optimisation feedback.', stack: ['Python', 'NLP', 'FastAPI', 'AI analysis'], flow: ['Résumé + job description', 'Analyse alignment', 'Actionable feedback'], focus: 'Making feedback easier to act on', detail: 'The application compares a résumé with a target job description, using NLP and AI analysis to help surface opportunities for improvement.', takeaway: 'Applying AI to a familiar workflow, translating analysis into useful feedback, and exposing the functionality through a FastAPI application.', url: 'https://github.com/RaghavendraPedada-1765/AI_ATS_Check' },
];
const stations = [
  { title: 'Build the whole ship.', copy: 'From interfaces to APIs and databases, I work across the application to turn ideas into working software.', tags: ['React', 'TypeScript', 'JavaScript', 'FastAPI', 'Node.js', 'Next.js', 'Express', 'MySQL', 'MongoDB'] },
  { title: 'Find meaning in the archives.', copy: 'Exploring retrieval, language models and natural language processing to connect people with useful information.', tags: ['Python', 'LangChain', 'RAG pipelines', 'LLM integration', 'NLP', 'Vector databases'] },
  { title: 'Understand the system. Chart a course.', copy: 'Building a foundation in blockchain and computer science, with tools to reason about systems and their behaviour.', tags: ['Solidity', 'Ethereum', 'SHA-256', 'Proof-of-Work', 'DSA', 'DBMS', 'Computer networks'] },
  { title: 'Make ideas work in the real world.', copy: 'Connecting devices, testing software and working with practical tools that support reliable development.', tags: ['Arduino', 'ESP32', 'MQTT', 'IoT', 'Software testing', 'Git', 'Linux', 'Docker', 'CI / CD'] },
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
  $('#project-content').innerHTML = `<span class="eyebrow">EXPEDITION ${p.number} / ${p.category}</span><h2 id="project-title">${p.name}</h2><p class="project-lead">${p.description}</p><div class="skill-tags">${p.stack.map(t => `<span>${t}</span>`).join('')}</div><div class="project-diagram" aria-label="Conceptual project flow">${p.flow.map((t, i) => `${i ? '<b aria-hidden="true">→</b>' : ''}<span>${t}</span>`).join('')}</div><div class="project-detail-grid"><div><h3>${p.focus}</h3><p>${p.detail}</p></div><div><h3>What this explores</h3><p>${p.takeaway}</p></div></div><div class="project-bottom"><a class="primary-button" href="${p.url}" target="_blank" rel="noopener noreferrer">EXPLORE THE SOURCE <span>↗</span></a><button class="line-link" id="next-project">Next island →</button></div>`;
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
