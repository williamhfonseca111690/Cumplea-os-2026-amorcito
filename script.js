/* ==========================================================
   QUIZ DE CUMPLEAÑOS
   Motor de audio + lógica del quiz + ajuste a una sola pantalla
   ========================================================== */
(function () {
  "use strict";

  /* =========================================================
     1. MOTOR DE AUDIO
     - Arranca con el primer clic (política de autoplay)
     - Al llegar a 2:03 lanza una copia nueva desde el segundo 0
       y deja que la anterior termine sonando encima
     - Repetición indefinida
     ========================================================= */
  var AudioEngine = (function () {
    var SRC        = "assets/ladrona.mp3";
    var RESTART_AT = 123;      // 2:03
    var TICK_MS    = 100;

    var decks = [], active = 0, started = false, muted = false, ticker = null;

    function buildDeck() {
      var a = new Audio(SRC);
      a.preload = "auto";
      a.loop = false;
      a.volume = 1;
      a.muted = muted;
      a.setAttribute("playsinline", "");
      a.addEventListener("ended", function () {
        if (decks[active] === a) handoff();
      });
      return a;
    }

    function handoff() {
      var next = (active + 1) % decks.length;
      var deck = decks[next];
      try { deck.currentTime = 0; } catch (e) { /* no-op */ }
      deck.muted = muted;
      var p = deck.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
      active = next;
    }

    function tick() {
      var cur = decks[active];
      if (!cur || cur.paused) return;
      if (cur.currentTime >= RESTART_AT) handoff();
    }

    function paint() {
      var btn = document.getElementById("musicToggle");
      if (!btn) return;
      btn.classList.toggle("is-muted", muted);
      btn.classList.toggle("is-playing", started && !muted);
    }

    return {
      start: function () {
        if (started) return;
        started = true;
        decks = [buildDeck(), buildDeck()];
        active = 0;
        var p = decks[0].play();
        if (p && typeof p.catch === "function") {
          p.catch(function () { started = false; paint(); });
        }
        if (ticker) clearInterval(ticker);
        ticker = setInterval(tick, TICK_MS);
        paint();
      },
      toggle: function () {
        if (!started) { this.start(); return; }
        muted = !muted;
        for (var i = 0; i < decks.length; i++) decks[i].muted = muted;
        paint();
      }
    };
  })();

  /* =========================================================
     2. DATOS
     ========================================================= */

  // Claves internas neutras: nada aquí delata los planes
  var PLANS = {
    penumbra: {
      emoji: "🥣",
      name: "Cata a ciegas de Changua Deconstructiva en un Speakeasy de Chapinero",
      desc: "Siete versiones de changua servidas en copa alta, en un sótano sin letrero, con los ojos vendados. Sales confundida, pero culta.",
      specs: ["Con venda", "Sótano sin letrero", "Cero fotos"]
    },
    multitud: {
      emoji: "📸",
      name: "Safari Fotográfico de Retratos Empíricos en TransMilenio",
      desc: "Seis horas documentando la fauna urbana, articulado por articulado. Tú disparas y yo te sostengo en las curvas.",
      specs: ["Zapato cómodo", "Batería al 100%", "Modo ráfaga"]
    },
    pluvia: {
      emoji: "🌧️",
      name: "Cata de Aguas Lluvias de la Sabana en Teusaquillo",
      desc: "Siete muestras de lluvia recogidas en distintos tejados, servidas en frascos con etiqueta. Hablamos de cuerpo, mineralidad y carácter de nube.",
      specs: ["Frascos rotulados", "Paladar valiente", "Fe ciega"]
    }
  };

  var SCORE_LABELS = {
    penumbra: "Afinidad subterránea",
    multitud: "Afinidad multitudinaria",
    pluvia:   "Afinidad pluvial"
  };

  var QUESTIONS = [
    {
      dept: "Área de Horarios",
      text: "Son las 5 de la mañana y suena la alarma. ¿Qué te hace levantar?",
      options: [
        { t: "Saber que hay algo calientico esperándome. Solo por eso.", w: { penumbra: 3 } },
        { t: "Que si no salgo ya, me va a coger la fila y el trancón.", w: { multitud: 3 } },
        { t: "Nada. Me quedo oyendo si eso es la alarma o es la lluvia.", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Sorpresas",
      text: "Te llevo a un sitio y en la puerta no hay nada: ni letrero, ni menú, ni luz. Solo un señor mirándote.",
      options: [
        { t: "Entro. Cuando no hay letrero es porque ahí sí sabe bueno.", w: { penumbra: 3 } },
        { t: "Le pregunto al señor cuánta gente hay adentro.", w: { multitud: 2, pluvia: 1 } },
        { t: "Le pregunto al señor si adentro hay techo.", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Clima",
      text: "Salimos con sol radiante. A los veinte minutos está cayendo un aguacero de esos.",
      options: [
        { t: "Nos metemos al primer sitio que tenga puerta y ahí nos quedamos.", w: { penumbra: 3 } },
        { t: "Sigo caminando. Ver a todo el mundo corriendo es un espectáculo.", w: { multitud: 3 } },
        { t: "Me quedo quieta y te miro. Yo sabía. Yo siempre sé.", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Multitudes",
      text: "Vas en un bus lleno, pero lleno lleno. Alguien te pisa y ni se disculpa.",
      options: [
        { t: "Me bajo en la siguiente y me tomo algo en un sitio vacío.", w: { penumbra: 3 } },
        { t: "Nada. Eso venía incluido en el combo, ya lo tenía asumido.", w: { multitud: 4 } },
        { t: "Le echo la culpa a la lluvia, que fue la que llenó el bus.", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Fotografía",
      text: "Te paso mi celular y solo queda 8% de batería. ¿En qué te la gastas?",
      options: [
        { t: "En una foto de la mesa, con esa lucecita amarilla que sale bonita.", w: { penumbra: 3 } },
        { t: "En veinte fotos de desconocidos haciendo cosas inexplicables.", w: { multitud: 4 } },
        { t: "En un video de diez minutos del agua cayendo del techo.", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Vasos y Tazas",
      text: "Escoge un recipiente. No preguntes para qué. De verdad, es mejor que no sepas.",
      options: [
        { t: "Un pocillo viejo, de esos que uno agarra con las dos manos.", w: { penumbra: 3 } },
        { t: "Un vaso de plástico, que igual se me va a caer.", w: { multitud: 3 } },
        { t: "Un frasco con tapa. Por si hay que guardar algo… líquido.", w: { pluvia: 4 } }
      ]
    },
    {
      dept: "Área de Confianza",
      text: "Te digo «pruébalo, confía en mí» y se me nota que no me estás creyendo.",
      options: [
        { t: "Cierro los ojos y pruebo. Después me arrepiento, pero pruebo.", w: { penumbra: 4 } },
        { t: "Pruebas tú primero y yo te grabo la cara.", w: { multitud: 3 } },
        { t: "Primero: ¿eso de dónde salió y cuánto tiempo lleva ahí?", w: { pluvia: 3 } }
      ]
    },
    {
      dept: "Área de Bogotá",
      text: "Bogotá te cae bien cuando…",
      options: [
        { t: "…está oscuro, hace frío y uno está adentro, bien tapadito.", w: { penumbra: 4 } },
        { t: "…está a reventar de gente y uno igual llega a donde iba.", w: { multitud: 4 } },
        { t: "…acabó de llover y todo huele raro, pero rico.", w: { pluvia: 4 } }
      ]
    },
    {
      dept: "Área del Amor",
      text: "Momento romántico ideal. Sé honesta, esto no lo lee nadie más.",
      options: [
        { t: "Los dos escondidos, compartiendo algo caliente, sin que nadie nos vea.", w: { penumbra: 4 } },
        { t: "Los dos mirándonos, con doscientos desconocidos empujándonos.", w: { multitud: 4 } },
        { t: "Los dos empapados, sin paraguas y sin salir corriendo.", w: { pluvia: 4 } }
      ]
    },
    {
      dept: "Gerencia del Cumpleaños",
      text: "Última, y de esta depende todo: ¿qué tan dispuesta estás a que te sorprendan?",
      options: [
        { t: "Muchísimo. Sorpréndeme, que yo confío en ti.", w: { penumbra: 2, multitud: 1, pluvia: 1 } },
        { t: "Dispuesta, pero avísame si me toca caminar mucho.", w: { multitud: 2, penumbra: 1 } },
        { t: "Dispuesta, aunque me gustaría saber si llevo paraguas.", w: { pluvia: 2, multitud: 1 } }
      ]
    }
  ];

  var LOAD_MESSAGES = [
    "Inicializando el algoritmo del amor…",
    "Cruzando tus respuestas con la base de datos de tus antojos…",
    "Calibrando el índice de romanticismo aplicado…",
    "Contrastando con tu perfil de los últimos meses…",
    "Depurando las opciones menos compatibles…",
    "Confirmando disponibilidad para el sábado…",
    "Resultado listo. Respira, amorcito."
  ];

  var KEYS = ["A", "B", "C", "D"];

  /* =========================================================
     3. ESTADO
     ========================================================= */
  var state = {
    index: 0,
    answers: new Array(QUESTIONS.length).fill(null),
    scores: { penumbra: 0, multitud: 0, pluvia: 0 },
    lock: false
  };

  var timers = [];
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }
  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); clearInterval(id); });
    timers = [];
  }

  function $(id) { return document.getElementById(id); }
  var el = {};

  /* =========================================================
     4. AJUSTE A UNA SOLA PANTALLA
     La tarjeta se escala hasta caber en el alto disponible.
     Así nunca hay scroll, en ningún celular.
     ========================================================= */
  // `zoom` cambia el layout de verdad, así que no pelea con el backdrop-filter.
  // transform sí lo hace: deja un rectángulo fantasma del tamaño sin escalar.
  var CAN_ZOOM = (typeof CSS !== "undefined" && CSS.supports &&
                  CSS.supports("zoom", "0.9"));

  function applyScale(card, k) {
    if (k >= 1) {
      card.style.zoom = "";
      card.style.transform = "none";
      card.classList.remove("is-scaled");
    } else if (CAN_ZOOM) {
      card.style.transform = "none";
      card.classList.remove("is-scaled");
      card.style.zoom = k.toFixed(4);
    } else {
      card.style.zoom = "";
      card.style.transform = "scale(" + k.toFixed(4) + ")";
      card.classList.add("is-scaled");
    }
  }

  function fitCurrent() {
    var screen = document.querySelector(".screen.is-visible");
    if (!screen) return;
    var card = screen.querySelector(".card");
    var stage = $("stage");
    if (!card || !stage) return;

    applyScale(card, 1);
    var avail = stage.clientHeight;
    if (!avail) return;

    // Con zoom el texto puede re-partirse en otras líneas, así que
    // convergemos en unas pocas pasadas en vez de calcular una sola vez.
    var k = 1, guard = 0;
    while (guard++ < 6) {
      var h = card.getBoundingClientRect().height;
      if (!h || h <= avail) break;
      k = Math.max(k * (avail / h) * 0.995, 0.5);
      applyScale(card, k);
      if (k <= 0.5) break;
    }
  }

  var fitPending = null;
  function scheduleFit() {
    if (fitPending) cancelAnimationFrame(fitPending);
    fitPending = requestAnimationFrame(function () {
      fitPending = null;
      fitCurrent();
    });
  }

  /* =========================================================
     5. CAMBIO DE PANTALLA
     ========================================================= */
  function showScreen(id) {
    var next = $(id);
    var cur = document.querySelector(".screen.is-visible");
    if (!next || cur === next) return;

    if (!cur) {
      next.classList.add("is-visible", "is-in");
      scheduleFit();
      return;
    }
    cur.classList.add("is-out");
    setTimeout(function () {
      cur.classList.remove("is-visible", "is-in", "is-out");
      next.classList.add("is-visible", "is-in");
      scheduleFit();
    }, 300);
  }

  /* =========================================================
     6. CORAZONES DE FONDO
     ========================================================= */
  function buildHearts() {
    var host = $("hearts");
    if (!host) return;
    var glyphs = ["💗", "💖", "✦", "💞", "✧", "🩷", "💫"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 14; i++) {
      var h = document.createElement("i");
      h.textContent = glyphs[i % glyphs.length];
      h.style.left = (Math.random() * 96).toFixed(2) + "%";
      h.style.setProperty("--s", (11 + Math.random() * 18).toFixed(0) + "px");
      h.style.setProperty("--d", (13 + Math.random() * 14).toFixed(1) + "s");
      h.style.setProperty("--dl", (Math.random() * 20).toFixed(1) + "s");
      frag.appendChild(h);
    }
    host.appendChild(frag);
  }

  /* =========================================================
     7. PREGUNTAS
     ========================================================= */
  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;

    el.qCounter.textContent = "Pregunta " + (state.index + 1) + " de " + total;
    el.qDept.textContent = q.dept;
    el.qText.textContent = q.text;
    el.qProgress.style.width = (state.index / total * 100) + "%";

    el.qOptions.innerHTML = "";
    q.options.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";

      var k = document.createElement("span");
      k.className = "opt__key";
      k.textContent = KEYS[i] || String(i + 1);

      var t = document.createElement("span");
      t.className = "opt__txt";
      t.textContent = opt.t;

      b.appendChild(k);
      b.appendChild(t);
      b.addEventListener("click", function () { pick(i); });
      el.qOptions.appendChild(b);
    });

    var prev = state.answers[state.index];
    if (prev !== null && prev !== undefined) {
      var node = el.qOptions.children[prev];
      if (node) node.classList.add("is-selected");
    }

    el.btnBack.disabled = state.index === 0;
    el.btnNext.disabled = prev === null || prev === undefined;
    el.btnNextLabel.textContent =
      state.index === total - 1 ? "Ver mi resultado" : "Siguiente";

    state.lock = false;
    scheduleFit();
  }

  function pick(i) {
    if (state.lock) return;
    state.answers[state.index] = i;

    Array.prototype.forEach.call(el.qOptions.children, function (node, n) {
      node.classList.toggle("is-selected", n === i);
    });

    el.btnNext.disabled = false;
    state.lock = true;
    later(function () { state.lock = false; goNext(); }, 720);
  }

  function goNext() {
    if (state.answers[state.index] === null) return;
    clearTimers();
    state.lock = true;

    if (state.index < QUESTIONS.length - 1) {
      state.index++;
      fadeSwap(renderQuestion);
    } else {
      el.qProgress.style.width = "100%";
      computeScores();
      runLoading();
    }
  }

  function goBack() {
    if (state.index === 0) return;
    clearTimers();
    state.index--;
    fadeSwap(renderQuestion);
  }

  function fadeSwap(fn) {
    var body = el.qOptions.parentNode; // .q-body
    body.style.transition = "opacity .2s ease";
    body.style.opacity = "0";
    setTimeout(function () {
      fn();
      body.style.opacity = "";
      setTimeout(function () { body.style.transition = ""; }, 240);
    }, 210);
  }

  /* =========================================================
     8. CALCULO
     ========================================================= */
  function computeScores() {
    state.scores = { penumbra: 0, multitud: 0, pluvia: 0 };
    state.answers.forEach(function (ans, qi) {
      if (ans === null || ans === undefined) return;
      var w = QUESTIONS[qi].options[ans].w || {};
      Object.keys(w).forEach(function (k) {
        state.scores[k] = (state.scores[k] || 0) + w[k];
      });
    });
  }

  function winner() {
    var keys = Object.keys(state.scores), best = keys[0];
    keys.forEach(function (k) { if (state.scores[k] > state.scores[best]) best = k; });
    return best;
  }

  /* =========================================================
     9. CARGA
     ========================================================= */
  function runLoading() {
    showScreen("screen-loading");
    el.loadBar.style.transition = "none";
    el.loadBar.style.width = "0%";
    el.loadPct.textContent = "0%";
    el.loadStatus.textContent = LOAD_MESSAGES[0];

    var DURATION = 4000;
    var start = Date.now();
    var msgIdx = 0;

    setTimeout(function () { el.loadBar.style.transition = "width .25s linear"; }, 40);

    // setInterval y no requestAnimationFrame: así la barra no se congela
    // si la pestaña queda en segundo plano a mitad del suspenso.
    var iv = setInterval(function () {
      var t = Math.min((Date.now() - start) / DURATION, 1);
      var pct = Math.round(t * 100);
      el.loadBar.style.width = pct + "%";
      el.loadPct.textContent = pct + "%";

      var want = Math.min(LOAD_MESSAGES.length - 1, Math.floor(t * LOAD_MESSAGES.length));
      if (want !== msgIdx) { msgIdx = want; el.loadStatus.textContent = LOAD_MESSAGES[msgIdx]; }

      if (t >= 1) { clearInterval(iv); later(showPlan, 300); }
    }, 80);
    timers.push(iv);
  }

  /* =========================================================
     10. EL PLAN  ->  EL GIRO  ->  LA INVITACION
     Tres pantallas separadas: cada una cabe sola, sin scroll.
     ========================================================= */
  function showPlan() {
    var key = winner();
    var plan = PLANS[key];

    el.planEmoji.textContent = plan.emoji;
    el.planName.textContent = plan.name;
    el.planDesc.textContent = plan.desc;

    el.planSpecs.innerHTML = "";
    plan.specs.forEach(function (s) {
      var li = document.createElement("li");
      li.textContent = s;
      el.planSpecs.appendChild(li);
    });

    var total = 0;
    Object.keys(state.scores).forEach(function (k) { total += state.scores[k]; });
    if (total === 0) total = 1;

    el.scoreBars.innerHTML = "";
    var rows = [];
    Object.keys(SCORE_LABELS).forEach(function (k) {
      var pct = Math.round(state.scores[k] / total * 100);
      var row = document.createElement("div");
      row.className = "sb" + (k === key ? " is-win" : "");
      row.innerHTML =
        '<span class="sb__label"></span>' +
        '<span class="sb__pct"></span>' +
        '<span class="sb__track"><span class="sb__fill"></span></span>';
      row.querySelector(".sb__label").textContent = SCORE_LABELS[k];
      row.querySelector(".sb__pct").textContent = pct + "%";
      el.scoreBars.appendChild(row);
      rows.push({ node: row.querySelector(".sb__fill"), pct: pct });
    });

    showScreen("screen-plan");
    later(function () {
      rows.forEach(function (r) { r.node.style.width = r.pct + "%"; });
    }, 650);

    // De aquí en adelante ella avanza con el botón "Siguiente":
    // plan -> ¿Será? -> día, hora y vestuario.
  }

  /* =========================================================
     11. REINICIO
     ========================================================= */
  function restart() {
    clearTimers();
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.scores = { penumbra: 0, multitud: 0, pluvia: 0 };
    state.lock = false;
    renderQuestion();
    showScreen("screen-quiz");
  }

  /* =========================================================
     12. ARRANQUE
     ========================================================= */
  function init() {
    el = {
      qCounter:   $("qCounter"),
      qDept:      $("qDept"),
      qText:      $("qText"),
      qOptions:   $("qOptions"),
      qProgress:  $("qProgress"),
      btnBack:    $("btnBack"),
      btnNext:    $("btnNext"),
      btnNextLabel: $("btnNextLabel"),
      loadBar:    $("loadBar"),
      loadPct:    $("loadPct"),
      loadStatus: $("loadStatus"),
      planEmoji:  $("planEmoji"),
      planName:   $("planName"),
      planDesc:   $("planDesc"),
      planSpecs:  $("planSpecs"),
      scoreBars:  $("scoreBars")
    };

    buildHearts();
    showScreen("screen-intro");

    // La música arranca con el primer clic en cualquier parte
    function firstTouch() {
      AudioEngine.start();
      ["pointerdown", "click", "keydown", "touchstart"].forEach(function (ev) {
        document.removeEventListener(ev, firstTouch, true);
      });
    }
    ["pointerdown", "click", "keydown", "touchstart"].forEach(function (ev) {
      document.addEventListener(ev, firstTouch, true);
    });

    $("musicToggle").addEventListener("click", function (e) {
      e.stopPropagation();
      AudioEngine.toggle();
    });

    $("btnStart").addEventListener("click", function () {
      AudioEngine.start();
      renderQuestion();
      showScreen("screen-quiz");
    });

    el.btnNext.addEventListener("click", goNext);
    el.btnBack.addEventListener("click", goBack);
    $("btnTwist").addEventListener("click", function () { showScreen("screen-twist"); });
    $("btnInvite").addEventListener("click", function () { showScreen("screen-invite"); });
    $("btnRestart").addEventListener("click", restart);

    // Reajustar cuando cambie el tamaño, la orientación o carguen las fuentes
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("orientationchange", scheduleFit);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleFit).catch(function () {});
    }
    later(scheduleFit, 400);
    later(scheduleFit, 1200);

    // Atajos de teclado
    document.addEventListener("keydown", function (e) {
      if (!$("screen-quiz").classList.contains("is-visible")) return;
      var map = { "1": 0, "2": 1, "3": 2, a: 0, b: 1, c: 2 };
      var k = e.key.toLowerCase();
      if (map[k] !== undefined && map[k] < QUESTIONS[state.index].options.length) {
        e.preventDefault();
        pick(map[k]);
      } else if (e.key === "ArrowLeft") {
        goBack();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (!el.btnNext.disabled) goNext();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
