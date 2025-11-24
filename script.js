/* Elements */

const btnFull = document.getElementById('btnFull');
const btnABO  = document.getElementById('btnABO');

const boardEl = document.getElementById('board');
const wellWraps = Array.from(document.querySelectorAll('.well-wrap'));
const dropperA = document.getElementById('dropperA');
const dropperB = document.getElementById('dropperB');
const dropperD = document.getElementById('dropperD');

const dropperDblock = document.getElementById('dropperDblock');
const wellDlabel = document.getElementById('wellDlabel');
const wellDwrap = document.getElementById('wellDwrap');
const dropperDlabel = document.getElementById('dropperDlabel');

const wellD = document.getElementById('wellD');

const answerSection = document.getElementById('answer-section');
const answersDiv = document.getElementById('answers');
const questionSection = document.getElementById('question-section');
const quizQuestion = document.getElementById('quiz-question');
const quizButtons = document.getElementById('quiz-buttons');
const scoreText = document.getElementById('scoreText');
const nextPatientBtn = document.getElementById('nextPatientBtn');

const wrongNotice = document.getElementById('wrongNotice');
const dropSound = document.getElementById('dropSound');

const bloodSample = document.getElementById('bloodSample');
const bloodSampleLabel = document.querySelector('.blood-sample-label');


let ABOOnly = false;
let currentPatient = null;
let applied = {A:false, B:false, D:false};
let bloodDroppedTo = {A:false, B:false, D:false}; // track where we dropped blood

/* Blood sets (unchanged) */
const bloodFull = [
  {type:"A+", A:true, B:false, D:true},
  {type:"A-", A:true, B:false, D:false},
  {type:"B+", A:false, B:true, D:true},
  {type:"B-", A:false, B:true, D:false},
  {type:"AB+",A:true,  B:true,  D:true},
  {type:"AB-",A:true,  B:true,  D:false},
  {type:"O+", A:false, B:false, D:true},
  {type:"O-", A:false, B:false, D:false}
];
const bloodABO = [
  {type:"A", A:true, B:false, D:false},
  {type:"B", A:false, B:true, D:false},
  {type:"AB",A:true,  B:true,  D:false},
  {type:"O", A:false, B:false, D:false}
];

/* Questions (kept unchanged) */
const questionsABO = [
  bt => ({ text: `Can this patient receive type B blood?`, answer: (bt.type === "B" || bt.type === "AB") }),
  bt => ({ text: `Does this patient have A antigen?`, answer: (bt.A === true) }),
  bt => ({ text: `Can this patient donate to AB recipient?`, answer: (true) }),
  bt => ({ text: `Can this patient receive type O blood?`, answer: true }),
  bt => ({ text: `Can this patient donate to type A?`, answer: (bt.type === "A" || bt.type === "O") })
];
const questionsFull = [
  bt => ({ text: `Can this patient donate to B+ recipient?`, answer: canDonate(bt, {A:false,B:true,D:true}) }),
  bt => ({ text: `Can this patient donate to AB+ recipient?`, answer: true }),
  bt => ({ text: `Can this patient receive blood from O- donor?`, answer: true }),
  bt => ({ text: `Is this patient Rh positive?`, answer: bt.D === true }),
  bt => ({ text: `Does this patient have A antigen?`, answer: bt.A === true }),
  bt => ({ text: `Can this patient receive from A+ donor?`, answer: canReceive(bt, {A:true,B:false,D:true}) }),
  bt => ({ text: `Can this patient donate to O- recipient?`, answer: canDonate(bt, {A:false,B:false,D:false}) })
];

/* compatibility helpers (unchanged) */
function aboDonate(donor, recipient) {
  if (donor.A && donor.B) return (recipient.A && recipient.B);
  if (donor.A) return recipient.A;
  if (donor.B) return recipient.B;
  return true;
}
function aboReceive(recipient, donor) { return aboDonate(donor, recipient); }
function rhDonate(donor, recipient) {
  if (!donor.D) return true;
  return recipient.D === true;
}
function canDonate(bt, target) { return aboDonate(bt, target) && rhDonate(bt, target); }
function canReceive(bt, donor) { return aboReceive(bt, donor) && rhDonate(donor, bt); }

/* pick patient */
function pickPatient() {
  return ABOOnly ? bloodABO[Math.floor(Math.random()*bloodABO.length)]
                 : bloodFull[Math.floor(Math.random()*bloodFull.length)];
}

/* show/hide D well visually (ABO mode) */
function applyRHVisibility() {
  if (!wellD) return;

  // clear previous
  wellD.classList.remove('d-disabled','x-disabled','x-pop','x-pulse');
  const oldLabel = wellD.querySelector('.disable-center-label');
  if (oldLabel) oldLabel.remove();

 if (ABOOnly) {
  // visually disable D partition
  wellD.classList.add('d-disabled','x-disabled');

  // add center "DISABLED" label
  const label = document.createElement('div');
  label.className = 'disable-center-label';
  wellD.appendChild(label);

  // 🔴 Hide Dropper D fully
  if (dropperDblock) dropperDblock.style.display = 'none';
} else {
  // normal mode: show dropper again
  if (dropperDblock) dropperDblock.style.display = 'flex';

  const old = wellD.querySelector('.disable-center-label');
  if (old) old.remove();
}
}

/* New patient: reset everything */
function newPatient() {
  // force question completely hidden at reset
  questionSection.style.display = 'none';
  currentPatient = pickPatient();
  applied = {A:false, B:false, D:false};
  bloodDroppedTo = {A:false, B:false, D:false};
  answersDiv.innerHTML = '';
  answerSection.classList.add('hidden');

  // hide question & score
  questionSection.classList.add('hidden');
  questionSection.classList.remove('active');
  scoreText.classList.remove('show','score-perfect');
  scoreText.textContent = '';

  nextPatientBtn.classList.remove('show');
  nextPatientBtn.style.pointerEvents = 'auto';

  // hide score-row
  const scoreRow = document.querySelector('#question-section .score-row');
  if (scoreRow) scoreRow.style.display = 'none';

  // clear partitions: remove clumps, reset puddles & reaction layers
  wellWraps.forEach(wrap => {
    wrap.querySelectorAll('.clump').forEach(n => n.remove());
    const fill = wrap.querySelector('.serum-fill');
    const reaction = wrap.querySelector('.reaction-layer');
    if (fill) {
      fill.style.width = '0%';
      fill.style.height = '0%';
      fill.style.left = '50%';
      fill.style.top = '50%';
      fill.style.transform = 'translate(-50%, -50%)';
      fill.style.background = 'transparent';
      fill.remove();
    }
    if (reaction) {
      reaction.style.height = '0%';
      reaction.style.opacity = 0;
      reaction.style.background = 'transparent';
      reaction.remove();
    }
    const well = wrap.querySelector('.partition');
    if (well) well.classList.remove('wrong-drop');
  });

  // hide blood sample — it will reveal after all serums are applied
  bloodSample.classList.add('hidden');
  if (bloodSampleLabel) bloodSampleLabel.classList.add('hidden');
  bloodSample.setAttribute("draggable", "false");

  // reset droppers visuals
  [dropperA, dropperB, dropperD].forEach(d => { if (d) d.classList.remove('dragging','snap','pick'); });

  // hide answers animation state
  answersDiv.classList.remove('show');

  // re-apply RH visibility
  applyRHVisibility();

  console.log('New patient:', currentPatient);
}

/* mode toggles */
function setModeABO() {
  ABOOnly = true;
  btnABO.classList.add('selected');
  btnFull.classList.remove('selected');
  applyRHVisibility();
  newPatient();
}
function setModeFull() {
  ABOOnly = false;
  btnFull.classList.add('selected');
  btnABO.classList.remove('selected');
  applyRHVisibility();
  newPatient();
}
btnABO.addEventListener('click', setModeABO);
btnFull.addEventListener('click', setModeFull);

/* SERUM drag & drop logic (serum fills partitions with puddles) */
document.addEventListener('dragstart', (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains('dropper')) return;
  if (el.classList.contains('hiddenRH')) { e.preventDefault(); return; }
  el.classList.add('dragging','pick');
  e.dataTransfer.setData('text/plain', el.dataset.type);
  try { e.dataTransfer.setDragImage(el, el.width/2, el.height/2); } catch (err) {}
});
document.addEventListener('dragend', (e) => {
  const el = e.target;
  if (!el.classList || !el.classList.contains('dropper')) return;
  el.classList.remove('dragging','pick');
  el.classList.add('snap');
  setTimeout(()=> el.classList.remove('snap'), 460);
});

/* Well drop handlers accept serum and (later) blood */
wellWraps.forEach(wrap => {
  const well = wrap.querySelector('.partition');
  well.addEventListener('dragover', (ev) => ev.preventDefault());

  well.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const dt = ev.dataTransfer.getData('text/plain');
    const target = wrap.dataset.well;

    // If ABO-only & D -> disabled notice & snap back
    if (ABOOnly && target === 'D' && dt !== 'blood') {
      showWrongNotice('Disabled (ABO only)');
      const dragging = document.querySelector('.dropper.dragging');
      if (dragging) { dragSnapBack(dragging); }
      return;
    }

    // If the drop is a serum (A/B/D)
    if (dt === 'A' || dt === 'B' || dt === 'D') {
      // wrong well (dragger to wrong partition)
      if (dt !== target) {
        wrap.querySelector('.partition').classList.add('wrong-drop');
        showWrongNotice('Wrong well!');
        setTimeout(()=> wrap.querySelector('.partition').classList.remove('wrong-drop'), 900);
        const dragging = document.querySelector('.dropper.dragging');
        if (dragging) dragSnapBack(dragging);
        return;
      }

      // already applied
      if (applied[dt]) { dragSnapBack(document.querySelector('.dropper.dragging')); return; }
      applied[dt] = true;

      // play drop sound if provided
      if (dropSound && typeof dropSound.play === 'function') {
        try { dropSound.currentTime = 0; dropSound.play(); } catch (err) {}
      }

      // create puddle on slide partition
      spawnSerumFill(wrap, dt);

      // remove dragging state
      const dragging = document.querySelector('.dropper.dragging');
      if (dragging) dragSnapBack(dragging);

      // When all serums applied -> reveal blood sample
      const allApplied = ABOOnly ? (applied.A && applied.B) : (applied.A && applied.B && applied.D);
      if (allApplied) revealBloodSample();
      return;
    }

    // If the drop is the blood sample
    if (dt === 'blood') {
      // if already dropped here do nothing
      if (bloodDroppedTo[target]) {
        return;
      }
      bloodDroppedTo[target] = true;

      // trigger reaction-layer mix animation (red mixing into serum puddle)
      spawnReactionMix(wrap);

      // if antigen is present for this partition, create clumps
      const antigenPresent = currentPatient[target];
      if (!antigenPresent) {
        showNoClump(wrap);
      } else {
        showClump(wrap);
      }

      // After blood placed in all required partitions, show answer options if not shown
      const allApplied = ABOOnly ? (applied.A && applied.B) : (applied.A && applied.B && applied.D);
      const bloodPlacedAll = ABOOnly ? (bloodDroppedTo.A && bloodDroppedTo.B) : (bloodDroppedTo.A && bloodDroppedTo.B && bloodDroppedTo.D);
      if (allApplied && bloodPlacedAll) {
        showAnswerOptions();
      }

      return;
    }
  });
});

/* Helper to visually snap a dropper back */
function dragSnapBack(el) {
  el.classList.remove('dragging');
  el.classList.add('snap');
  setTimeout(()=> el.classList.remove('snap'), 460);
}

/* Spawn small serum puddle (realistic droplet sitting on glass) */
function spawnSerumFill(wrap, serumType) {
  // ensure there's a single puddle per partition
  let fill = wrap.querySelector('.serum-fill');
  if (!fill) {
    fill = document.createElement('div');
    fill.className = 'serum-fill';
    wrap.querySelector('.partition').appendChild(fill);
  }

  // choose puddle color (soft translucent)
  fill.style.background = serumColor(serumType);

  // small droplet initially then expand to puddle (max controlled by --puddle-max)
  fill.style.width = '10%';
  fill.style.height = '10%';
  fill.style.left = '50%';
  fill.style.top = '40%';
  fill.style.transform = 'translate(-50%, -50%)';
  fill.style.opacity = 0.98;
  fill.style.filter = 'blur(0.2px)';

  // simulate droplet falling and spreading a bit
  setTimeout(() => {
    fill.style.width  = '36%';
    fill.style.height = '36%';
    fill.style.top = '54%'; // slightly lower to sit on slide
  }, 280);

  // create a visible reaction layered element to later mix blood into
  let reaction = wrap.querySelector('.reaction-layer');
  if (!reaction) {
    reaction = document.createElement('div');
    reaction.className = 'reaction-layer';
    wrap.querySelector('.partition').appendChild(reaction);
  }
  reaction.style.opacity = 0;
  reaction.style.width = '0%';
  reaction.style.height = '0%';
}

/* create droplet particle to animate fall */
function createDroplet(wrap, type) {
  const droplet = document.createElement('div');
  droplet.className = 'well-drop';

  if (type === 'blood') {
    droplet.style.background = 'rgb(180,15,15)';
  } else {
    droplet.style.background = serumColor(type);
  }

  // position relative to partition center for drop animation
  droplet.style.left = '50%';
  droplet.style.top  = '20%';
  droplet.style.transform = 'translate(-50%, -240%)';

  wrap.querySelector('.partition').appendChild(droplet);

  setTimeout(() => droplet.remove(), 900);
}

/* When blood dropped onto partition: spawn reaction (red mixes into puddle) */
function spawnReactionMix(wrap) {
  // Show falling blood droplet
  createDroplet(wrap, 'blood');

  // Play blood drop sound
const bloodDropSound = document.getElementById('bloodDropSound');
if (bloodDropSound) {
    bloodDropSound.currentTime = 0;
    bloodDropSound.play().catch(()=>{});
}
  const fill = wrap.querySelector('.serum-fill');
  const reaction = wrap.querySelector('.reaction-layer');

  setTimeout(() => {
    // if no serum present (user dropped blood before adding serum) create a small puddle effect
    if (!fill) {
      // create a shallow blood fill so blood drop still shows
      const tmp = document.createElement('div');
      tmp.className = 'serum-fill';
      tmp.style.background = 'var(--blood-red)';
      tmp.style.width = '28%';
      tmp.style.height = '28%';
      tmp.style.left = '50%';
      tmp.style.top = '54%';
      tmp.style.transform = 'translate(-50%, -50%)';
      tmp.style.opacity = 1;
      wrap.querySelector('.partition').appendChild(tmp);
    }

    // reaction overlay sits above puddle and grows to mix
    let serumCol = fill ? window.getComputedStyle(fill).backgroundColor : 'rgba(126,1,1,0.9)';

    reaction.style.left = '50%';
    reaction.style.top = '54%';
    reaction.style.width = '8%';
    reaction.style.height = '8%';
    reaction.style.transform = 'translate(-50%, -50%)';
    reaction.style.opacity = 0;

    reaction.style.background = `radial-gradient(circle, rgba(141,16,16,1) 0%, ${serumCol} 90%)`;

    // animate mix expanding and showing color
    setTimeout(() => {
      reaction.style.width  = '36%';
      reaction.style.height = '36%';
      reaction.style.opacity = 0.95;
    }, 120);
  }, 260);
}

/* Reveal the blood sample after all serums applied */
function revealBloodSample() {
  bloodSample.classList.remove('hidden');
  if (bloodSampleLabel) bloodSampleLabel.classList.remove('hidden');

  bloodSample.setAttribute("draggable", "true");  // ← ADD THIS

  // small pop-in animation
  bloodSample.style.transform = 'scale(.96)';
  setTimeout(()=> bloodSample.style.transform = 'scale(1)', 180);
}

/* serum color mapping (soft translucent) */
function serumColor(type) {
  if (type === 'A') return 'rgba(220,235,255,0.95)'; // pale blue-ish
  if (type === 'B') return 'rgba(255,245,205,0.95)'; // pale yellow-ish
  if (type === 'D') return 'rgba(240,240,245,0.95)'; // pale neutral
  return 'transparent';
}

/* Blood sample drag handlers */
bloodSample && bloodSample.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', 'blood');
  try { e.dataTransfer.setDragImage(bloodSample, bloodSample.width/2, bloodSample.height/2); } catch {}
});

bloodSample && bloodSample.addEventListener('dragend', (e) => {
  bloodSample.classList.remove('picked');
});

/* show when no clumping occurs -> smooth red mixture without particles */
function showNoClump(wrap) {
  const fill = wrap.querySelector('.serum-fill');
  const reaction = wrap.querySelector('.reaction-layer');

  setTimeout(() => {
    if (reaction) {
      reaction.style.opacity = 0.9;
      reaction.style.width = '36%';
      reaction.style.height = '36%';
      // make reaction a smooth red overlay (mixed)
      reaction.style.background = `radial-gradient(circle, rgba(150,20,20,0.95) 0%, rgba(200,40,40,0.9) 80%)`;
    }

    if (fill) {
      // transition fill to blood-like colour smoothly (no clumps)
      fill.style.transition = 'background 400ms, filter 400ms';
      fill.style.background = 'rgba(130,10,10,0.95)';
      fill.style.filter = 'blur(0.2px)';
      fill.style.width = '38%';
      fill.style.height = '38%';
    }
  }, 600);
}

/* show clumping: puddle first then create multiple organic clumps inside partition */
function showClump(wrap) {
  const fill = wrap.querySelector('.serum-fill');
  const reaction = wrap.querySelector('.reaction-layer');

  // Plasma becomes slightly lighter immediately to show reaction onset
  if (fill) {
    fill.style.background = 'rgba(255,230,120,0.9)';
    fill.style.width = '36%';
    fill.style.height = '36%';
    fill.style.top = '54%';
  }

  if (reaction) {
    reaction.style.opacity = 0.25;
    reaction.style.width = '36%';
    reaction.style.height = '36%';
  }

  // Delay before clumps begin forming to simulate agglutination kinetics
  setTimeout(() => {
    createClumps(wrap);
  }, 420);   // slightly faster onset for visual feedback
}

/* create clumps with smooth build-up: stagger multiple clumps for organic look */
function createClumps(wrap) {
    const fill = wrap.querySelector(".serum-fill");
    const part = wrap.querySelector(".partition");

    if (!fill) return;

    // Get % size of droplet
    const dropletSize = parseFloat(fill.style.width); // serum-fill is width: xx%
    const dropletCenter = 50; // always centered (your CSS already centers it)

    // Clumps spawn in a smaller circle (45% of the droplet radius)
    const radius = dropletSize * 0.22; 

    const count = 4; // number of clumps per reaction

    for (let i = 0; i < count; i++) {
        const c = document.createElement("div");
        c.className = "clump";

        // smaller clumps for realism
        const size = 12 + Math.random() * 16;
        c.style.width = size + "px";
        c.style.height = size + "px";

        // random angle + distance (polar coordinates)
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * radius;

        // convert to percentage placement
        const x = dropletCenter + dist * Math.cos(angle);
        const y = dropletCenter + dist * Math.sin(angle);

        c.style.left = x + "%";
        c.style.top = y + "%";

        // softer and darker realistic red
        c.style.background = "radial-gradient(circle, #7a0000 0%, #4a0000 70%)";

        // intro animation
        c.style.opacity = 0;
        c.style.transform = "scale(0.3)";

        setTimeout(() => {
            c.style.transition = "opacity 0.7s ease, transform 0.6s ease";
            c.style.opacity = 1;
            c.style.transform = "scale(1)";
        }, i * 150);

        part.appendChild(c);
    }
}

/* wrong notice */
let wrongTimer = null;
function showWrongNotice(text='Wrong well!') {
  if (wrongTimer) { clearTimeout(wrongTimer); wrongTimer = null; }
  wrongNotice.textContent = text;
  wrongNotice.classList.add('show');
  wrongTimer = setTimeout(()=> {
    wrongNotice.classList.remove('show');
    wrongTimer = null;
  }, 1200);
}

/* show answer options */
function showAnswerOptions(){
  answerSection.classList.remove('hidden');
  answersDiv.innerHTML = '';

  const list = ABOOnly ? ["A","B","AB","O"] : ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

  list.forEach(type => {
    const btn = document.createElement('button');
    btn.textContent = type;
    btn.className = 'answer-btn';
    btn.addEventListener('click', () => {
      document.querySelectorAll('#answers button').forEach(b => b.classList.remove('correct','wrong'));
      if (type === currentPatient.type) {
    btn.classList.add('correct');

    // smooth reveal of Next Sample button
    const nextBtn = document.getElementById("nextSampleBtn");
    nextBtn.style.display = "block";
    setTimeout(() => nextBtn.classList.add("show"), 50);

    // Optional: delay quiz section
    setTimeout(()=> showPostQuestion(), 700);
} else {
    btn.classList.add('wrong');
}
    });
    answersDiv.appendChild(btn);
  });

  // animate answers in
  setTimeout(()=> answersDiv.classList.add('show'), 16);
}

/* pick question */
function pickQuestion(){
  if (ABOOnly) {
    const fn = questionsABO[(Math.floor(Math.random()*questionsABO.length))];
    return fn(currentPatient);
  } else {
    const fn = questionsFull[(Math.floor(Math.random()*questionsFull.length))];
    return fn(currentPatient);
  }
}

/* grade yes/no */
function gradeYN(btn, correct, yesBtn, noBtn){
  yesBtn.disabled = true; noBtn.disabled = true;
  btn.classList.add(correct ? 'correct' : 'wrong');

  // set score text and green if perfect
  if (correct) {
    scoreText.textContent = "Score: 100%";
    scoreText.classList.add('score-perfect');
  } else {
    scoreText.textContent = "Score: 50%";
    scoreText.classList.remove('score-perfect');
  }
  scoreText.classList.add('show');

  // show Next patient button beside score (animated)
  nextPatientBtn.classList.add('show');

  // ensure score row visible
  const scoreRow = document.querySelector('#question-section .score-row');
  if (scoreRow) scoreRow.style.display = 'flex';
}

/* Next patient */
nextPatientBtn.addEventListener('click', () => {
  nextPatientBtn.classList.remove('show');
  newPatient();
});

/* Next Sample Button → Smooth fade & new random patient */
nextSampleBtn.addEventListener("click", () => {
    nextSampleBtn.classList.remove("show");
    setTimeout(() => {
        nextSampleBtn.style.display = "none";
        newPatient();
    }, 300);
});

/* initialize */
setModeFull();
newPatient();
