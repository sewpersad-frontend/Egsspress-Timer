let timer = null;
let remainingTime = 0;
let isPaused = false;

const $ = (sel) => document.querySelector(sel);

function voegNulToe(num) { return (num < 10 ? '0' : '') + num; }

function displayTime() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const text = `${voegNulToe(minutes)}:${voegNulToe(seconds)}`;
  const el = $('#timer');
  el.textContent = text;
  el.setAttribute('aria-label', `Resterende tijd ${minutes} minuut${minutes===1?'':'ten'} en ${seconds} seconde${seconds===1?'':'n'}`);
  updateStatus();
}

function setFromMinutesInput() {
  const inputVal = parseInt($('#minutes').value, 10);
  const minutes = Number.isFinite(inputVal) && inputVal > 0 ? Math.min(inputVal, 180) : 5;
  remainingTime = minutes * 60;
  displayTime();
}

function updateStatus() {
  const s = $('#status');
  if (timer && !isPaused) s.textContent = 'Bezig met aftellen…';
  else if (isPaused) s.textContent = 'Gepauzeerd';
  else if (remainingTime > 0) s.textContent = 'Klaar om te starten';
  else s.textContent = '';
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 1.05);
  } catch (e) {}
}

function startTimer() {
  if (timer !== null) return;
  if (!isPaused) setFromMinutesInput();
  isPaused = false;
  displayTime();
  timer = setInterval(updateTime, 1000);
  updateStatus();
}

function updateTime() {
  if (remainingTime > 0) {
    remainingTime--;
    displayTime();
  } else {
    clearInterval(timer);
    timer = null;
    playBeep();
    alert('De eieren zijn klaar!');
    updateStatus();
  }
}

function pauseTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
    isPaused = true;
    updateStatus();
  }
}

function resetTimer() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  isPaused = false;
  remainingTime = 0;
  $('#timer').textContent = '00:00';
  $('#minutes').value = '5';
  updateStatus();
}

window.addEventListener('DOMContentLoaded', () => {
  setFromMinutesInput();

  $('#startBtn').addEventListener('click', startTimer);
  $('#pauseBtn').addEventListener('click', () => {
    if (isPaused) {
      isPaused = false;
      if (timer === null && remainingTime > 0) {
        timer = setInterval(updateTime, 1000);
      }
      updateStatus();
    } else {
      pauseTimer();
    }
  });
  $('#resetBtn').addEventListener('click', resetTimer);

  document.querySelectorAll('.chip[data-min]').forEach(btn => {
    btn.addEventListener('click', () => {
      const m = parseInt(btn.getAttribute('data-min'), 10);
      $('#minutes').value = String(m);
      isPaused = false;
      setFromMinutesInput();
    });
  });

  const baseTimes = { zacht: 5, medium: 7, hard: 9 };
  const sizeOffset = (size) => ({ S: -1, M: 0, L: 1, XL: 2 }[size] ?? 0);
  function applyMode(mode) {
    const size = $('#eggSize').value;
    const base = baseTimes[mode] ?? 5;
    const mins = Math.max(1, base + sizeOffset(size));
    $('#minutes').value = String(mins);
    isPaused = false;
    setFromMinutesInput();
    document.querySelectorAll('#modes .mode').forEach(b=>b.classList.remove('active'));
    const activeBtn = document.querySelector(`#modes .mode[data-mode="${mode}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    $('#status').textContent = `Stand: ${mode} (${size}) – ${mins} min`;
  }
  document.querySelectorAll('#modes .mode').forEach(btn=>{
    btn.addEventListener('click', ()=> applyMode(btn.dataset.mode));
  });
  $('#eggSize').addEventListener('change', ()=>{
    const current = document.querySelector('#modes .mode.active');
    if (current) applyMode(current.dataset.mode);
  });

  $('#minutes').addEventListener('input', () => {
    const v = parseInt($('#minutes').value, 10);
    if (!Number.isFinite(v) || v < 1) $('#minutes').value = '1';
    if (v > 180) $('#minutes').value = '180';
    isPaused = false;
    setFromMinutesInput();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); startTimer(); }
    if (e.code === 'Space') { e.preventDefault();
      if (timer) { pauseTimer(); }
      else if (remainingTime > 0) { isPaused = false; timer = setInterval(updateTime, 1000); updateStatus(); }
    }
    if (e.key.toLowerCase() === 'r') { resetTimer(); }
  });
});
