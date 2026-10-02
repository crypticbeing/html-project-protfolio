// ---------- Sticky nav shadow + mobile menu ----------
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const navLinks = document.getElementById("navLinks");

window.addEventListener("scroll", () => {
  nav.classList.toggle("is-scrolled", window.scrollY > 10);
});

burger.addEventListener("click", () => {
  const open = navLinks.classList.toggle("is-open");
  burger.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  })
);

// ---------- Reveal on scroll ----------
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("is-visible");
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// ---------- Hero: text flowing along the wave ----------
const waveText = document.getElementById("waveText");
let offset = 0;
function animateWave() {
  offset -= 0.02;
  if (offset < -50) offset = 0;
  waveText.setAttribute("startOffset", offset + "%");
  requestAnimationFrame(animateWave);
}
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) animateWave();

// ---------- Phone: dictated message typing in ----------
const phoneTyping = document.getElementById("phoneTyping");
const phoneMsg = "Perfect, see you at 7! 🥟";
function typePhone() {
  let i = 0;
  phoneTyping.textContent = "";
  const t = setInterval(() => {
    phoneTyping.textContent = phoneMsg.slice(0, ++i);
    if (i >= phoneMsg.length) {
      clearInterval(t);
      setTimeout(typePhone, 3000);
    }
  }, 60);
}
typePhone();

// ---------- Keyboard vs Flow race ----------
const sentence =
  "Getting started with Flow is easy. Just hold the key, speak naturally, and watch your words appear in any app. It's like having a writing assistant that keeps up with your thoughts.";
const keyText = document.getElementById("keyText");
const flowText = document.getElementById("flowText");
let raceTimers = [];

function race() {
  raceTimers.forEach(clearInterval);
  keyText.textContent = "";
  flowText.textContent = "";
  const words = sentence.split(" ");
  let k = 0;
  let f = 0;
  // 220 wpm vs 45 wpm, scaled up for the demo
  raceTimers = [
    setInterval(() => {
      if (f < words.length) flowText.textContent += (f ? " " : "") + words[f++];
    }, 90),
    setInterval(() => {
      if (k < words.length) keyText.textContent += (k ? " " : "") + words[k++];
    }, 440),
  ];
}
document.getElementById("micBtn").addEventListener("click", race);

const compare = document.querySelector(".compare");
new IntersectionObserver(
  (entries, obs) => {
    if (entries[0].isIntersecting) {
      race();
      obs.disconnect();
    }
  },
  { threshold: 0.4 }
).observe(compare);

// ---------- Role chips ----------
const roleCopy = {
  Leaders: "Lead from anywhere. Fire off thoughtful replies, strategy notes and feedback in seconds — at the speed you think.",
  Consultants: "Capture client insights the moment they happen and turn rambling notes into crisp deliverables.",
  Creators: "Scripts, captions and newsletters, written as fast as you can say them.",
  "Customer Support": "Answer tickets 4x faster with replies that sound warm, clear and on-brand.",
  Designers: "Leave rich feedback in Figma, Linear and Slack without breaking your creative flow.",
  Engineers: "Dictate PR descriptions, docs and prompts to your AI editor — Flow knows your variable names.",
  Educators: "Grade, give feedback and plan lessons without being chained to a keyboard.",
  Freelancers: "Proposals, invoices and follow-ups — done before your coffee gets cold.",
  Healthcare: "Spend less time charting and more time with patients.",
  Lawyers: "Draft memos and emails in your voice, with your terminology, in a fraction of the time.",
  Marketers: "Brainstorm campaigns out loud and get polished copy back instantly.",
  Product: "Write specs, updates and tickets at the speed of conversation.",
  Recruiters: "Personalised outreach at scale, without the copy-paste.",
  Sales: "Follow up faster than the competition with notes that write themselves.",
  Students: "Turn lectures and ideas into notes and essays — your voice, your words.",
  Writers: "Get the first draft out of your head and onto the page, then let Flow tidy it up.",
};
const roleCopyEl = document.getElementById("roleCopy");
const defaultCopy = roleCopyEl.textContent;
document.querySelectorAll("#roleChips .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll("#roleChips .chip").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    roleCopyEl.textContent = roleCopy[chip.textContent] || defaultCopy;
  });
});

// ---------- Personal dictionary: words get learned over time ----------
const dictList = document.getElementById("dictList");
const newWords = ["Zendaya", "PostgreSQL", "Niamh", "Tailwind", "Shopify", "Xiaomi", "Raspberry Pi"];
let w = 0;
setInterval(() => {
  const li = document.createElement("li");
  li.textContent = newWords[w++ % newWords.length];
  li.className = "new";
  dictList.prepend(li);
  if (dictList.children.length > 6) dictList.lastElementChild.remove();
  setTimeout(() => li.classList.remove("new"), 1200);
}, 2500);

// ---------- Tones per app ----------
const toneOut = document.getElementById("toneOut");
const tones = document.querySelectorAll(".tone");
function setTone(btn) {
  tones.forEach((t) => t.classList.remove("is-active"));
  btn.classList.add("is-active");
  toneOut.style.opacity = 0;
  setTimeout(() => {
    toneOut.textContent = btn.dataset.tone;
    toneOut.style.opacity = 1;
  }, 200);
}
tones.forEach((btn) => btn.addEventListener("click", () => setTone(btn)));
let toneIdx = 0;
setInterval(() => setTone(tones[++toneIdx % tones.length]), 3500);

// ---------- Languages ring ----------
const flags = ["🇺🇸", "🇫🇷", "🇩🇪", "🇪🇸", "🇮🇹", "🇯🇵", "🇰🇷", "🇨🇳", "🇮🇳", "🇧🇷", "🇷🇺", "🇸🇦", "🇳🇱", "🇸🇪", "🇹🇷", "🇬🇧"];
const ring = document.getElementById("langRing");
flags.forEach((f, i) => {
  const s = document.createElement("span");
  const angle = (i / flags.length) * 360;
  s.textContent = f;
  s.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translateY(-130px) rotate(${-angle}deg)`;
  ring.appendChild(s);
});

// ---------- Testimonials: duplicate for seamless loop ----------
const loveTrack = document.getElementById("loveTrack");
[...loveTrack.children].forEach((card) => {
  const clone = card.cloneNode(true);
  clone.setAttribute("aria-hidden", "true");
  loveTrack.appendChild(clone);
});

// ---------- Footer year ----------
document.getElementById("year").textContent = new Date().getFullYear();
