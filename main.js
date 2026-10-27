const nav = document.querySelector(".gooey-nav");
const segments = Array.from(nav.querySelectorAll("li"));
const links = segments.map((segment) => segment.querySelector("a"));
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const span = 20;
const radius = 12;
const neckHeight = 100;
const neckBreak = 0.22;
const svgNS = "http://www.w3.org/2000/svg";
let active = 0;
let frame = null;
let lastTime = null;

function neckPath(gap) {
  if (!Number.isFinite(gap) || gap <= 0) return "";
  const waist = neckHeight * (1 - gap / (span * neckBreak));
  if (waist <= 0) return "";
  const start = span - gap;
  const mid = start + gap / 2;
  return `M${start} 0 Q${mid} ${neckHeight - waist} ${span} 0 L${span} ${neckHeight} Q${mid} ${waist} ${start} ${neckHeight} Z`;
}

const states = segments.map((segment, index) => {
  let path = null;
  let stops = [];
  if (index > 0) {
    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("gooey-neck");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", span);
    svg.setAttribute("viewBox", `0 0 ${span} ${neckHeight}`);
    svg.setAttribute("preserveAspectRatio", "none");

    const defs = document.createElementNS(svgNS, "defs");
    const gradient = document.createElementNS(svgNS, "linearGradient");
    const gradientId = `gooey-neck-${index}`;
    gradient.id = gradientId;
    gradient.setAttribute("x1", "0%");
    gradient.setAttribute("x2", "100%");
    stops = [0, 1].map((offset) => {
      const stop = document.createElementNS(svgNS, "stop");
      stop.setAttribute("offset", offset);
      gradient.append(stop);
      return stop;
    });
    defs.append(gradient);
    path = document.createElementNS(svgNS, "path");
    path.setAttribute("fill", `url(#${gradientId})`);
    svg.append(defs, path);
    segment.prepend(svg);
  }
  return {
    segment,
    path,
    stops,
    values: [0, 0, 0],
    targets: [0, 0, 0],
    velocities: [0, 0, 0],
  };
});

function draw(state) {
  const [gap, left, right] = state.values;
  state.segment.style.marginLeft = `${gap}px`;
  state.segment.style.borderRadius = `${left}px ${right}px ${right}px ${left}px`;
  if (state.path) state.path.setAttribute("d", neckPath(gap));
}

function animate(time) {
  const dt = lastTime === null ? 1 / 60 : Math.min((time - lastTime) / 1000, 1 / 30);
  lastTime = time;
  let moving = false;
  for (const state of states) {
    for (let i = 0; i < state.values.length; i++) {
      // Small integration steps keep the damped spring stable after slow frames.
      for (let step = 0; step < 4; step++) {
        const acceleration =
          200 * (state.targets[i] - state.values[i]) - 28 * state.velocities[i];
        state.velocities[i] += acceleration * dt / 4;
        state.values[i] += state.velocities[i] * dt / 4;
      }
      if (
        Math.abs(state.targets[i] - state.values[i]) < 0.01 &&
        Math.abs(state.velocities[i]) < 0.01
      ) {
        state.values[i] = state.targets[i];
        state.velocities[i] = 0;
      } else {
        moving = true;
      }
    }
    draw(state);
  }
  frame = moving ? requestAnimationFrame(animate) : null;
  if (!moving) lastTime = null;
}

function select(instant = false) {
  const index = links.findIndex((link) => link.hash === location.hash);
  // As in the original component, an unmatched route keeps the last selection.
  if (index !== -1) active = index;
  document.querySelectorAll("main > section").forEach((section) => {
    section.hidden = section.id !== links[active].hash.slice(1);
  });
  const open = (seam) =>
    seam === 0 || seam === segments.length || seam - 1 === active || seam === active;

  states.forEach((state, i) => {
    const isActive = i === active;
    state.segment.classList.toggle("active", isActive);
    if (isActive) links[i].setAttribute("aria-current", "location");
    else links[i].removeAttribute("aria-current");
    state.targets = [
      i === 0 ? 0 : open(i) ? span : -1,
      open(i) ? radius : 0,
      open(i + 1) ? radius : 0,
    ];
    state.stops.forEach((stop, side) => {
      stop.setAttribute(
        "stop-color",
        i - 1 + side === active ? "var(--nav-active)" : "var(--nav-bar)",
      );
    });
  });

  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  lastTime = null;
  if (instant || reducedMotion.matches) {
    states.forEach((state) => {
      state.values = [...state.targets];
      state.velocities.fill(0);
      draw(state);
    });
  } else {
    frame = requestAnimationFrame(animate);
  }
}

window.addEventListener("hashchange", () => select());
reducedMotion.addEventListener("change", () => select());
select(true);


//Instant Mood

const camera = document.getElementById("camera");

camera.addEventListener("pointermove", (event) => {
  const rect = camera.getBoundingClientRect();

  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  console.log(`x: ${x}, y: ${y}`);
});

const shutter = document.getElementById("shutter");
const paper = document.getElementById("paper");
const message = document.getElementById("txt");


const advice = [
  "You look tired, get some rest.",
  "Smile a little more, it suits you.",
  "Shoulders look tight, drop them and breathe.",
  "Eyes look strained, look away from screens for a minute.",
  "Posture’s a little slumped, sit up straighter.",
  "You look focused, don’t overthink it.",
  "Skin looks dry, drink some water.",
  "Expression’s neutral, a small smile would help.",
  "Background’s messy, clear it for a better shot.",
  "Overall vibe is solid, shoot more.",
  "Angle flatters you, stay with it.",
  "Your hair looks great.",
  "Color suits you, nice choice.",
  "You look great today, keep that energy."
]



shutter.addEventListener("click", (event) => {
  if (paper.classList.contains("ejected")) {
    return; // Let this click bubble to the camera
  }

  event.stopPropagation();
  paper.classList.add("ejected");

  const index = Math.floor(Math.random() * advice.length);
  message.textContent = advice[index];
});

camera.addEventListener("click", () => {
  if (paper.classList.contains
    ("ejected") && !paper.classList.contains("remove")) {
    paper.classList.add("remove");
  }
});

paper.addEventListener("animationend", (event) => {
  if (
    event.animationName !== "paper-fall"
  ) return;

  paper.style.transition = "none";
  paper.classList.remove("remove", "ejected");
  void paper.getBoundingClientRect(); // Apply the reset immediately
  paper.style.removeProperty("transition");
});