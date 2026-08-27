/* ==========================================================
   QUIZ DE CUMPLEAÑOS · ADRIANA
   Lógica del quiz + motor de audio con reinicio solapado
   ========================================================== */
(function () {
  "use strict";

  /* =========================================================
     1. MOTOR DE AUDIO
     - Arranca con el primer clic del usuario (política autoplay)
     - Al llegar a 2:03 (123 s) arranca una copia nueva desde 0
       y deja que la anterior termine sonando encima -> transición
     - Repetición indefinida
     ========================================================= */
  var AudioEngine = (function () {
    var SRC        = "assets/ladrona.mp3";
    var RESTART_AT = 123;      // 2:03 en segundos
    var TICK_MS    = 100;

    var decks   = [];
    var active  = 0;
    var started = false;
    var muted   = false;
    var ticker  = null;

    function buildDeck() {
      var a = new Audio(SRC);
      a.preload = "auto";
      a.loop = false;
      a.volume = 1;
      a.muted = muted;
      a.setAttribute("playsinline", "");
      a.addEventListener("ended", function () {
        // Red de seguridad: si el track activo termina sin haber
        // alcanzado los 2:03, relanzamos de inmediato.
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
      },
      isStarted: function () { return started; }
    };
  })();

  /* =========================================================
     2. DATOS
     ========================================================= */

  // Claves internas neutras
  var PLANS = {
    penumbra: {
      emoji: "🥣",
      name: "Cata a ciegas de Changua Deconstructiva en un Speakeasy de Chapinero",
      desc: "Un sótano sin letrero, luz de vela, y siete versiones de changua servidas en copa alta mientras un señor de corbatín te explica las «notas de cilantro con final de leche larga». Traes los ojos vendados. Sales confundida, pero culta.",
      specs: ["Requiere venda", "Sótano sin letrero", "Cuchara de degustación", "Cero fotos"]
    },
    multitud: {
      emoji: "📸",
      name: "Safari Fotográfico de Retratos Empíricos en TransMilenio",
      desc: "Seis horas de expedición antropológica documentando la fauna urbana en su hábitat natural, articulado por articulado. Tú disparas, yo te sostengo para que no te caigas en las curvas. El troncal es el estudio y la hora pico es la luz dorada.",
      specs: ["Zapato cómodo", "Batería al 100%", "Reflejos rápidos", "Modo ráfaga"]
    },
    pluvia: {
      emoji: "🌧️",
      name: "Cata de Aguas Lluvias de la Sabana en Teusaquillo",
      desc: "Degustación comparada de siete muestras de lluvia recolectadas en distintos tejados de la Sabana, servidas a temperatura ambiente en frascos etiquetados. Discutimos cuerpo, mineralidad y «carácter de nube». Es tan absurdo que casi es arte.",
      specs: ["Paraguas opcional", "Frascos rotulados", "Paladar valiente", "Fe ciega"]
    }
  };

  var SCORE_LABELS = {
    penumbra: "Afinidad subterránea",
    multitud: "Afinidad multitudinaria",
    pluvia:   "Afinidad pluvial"
  };

  var QUESTIONS = [
    {
      tag: "Tema: la hora",
      dept: "Área de Horarios",
      text: "¿A qué hora del día te sientes mejor?",
      options: [
        { t: "Bien temprano, tipo 5 de la mañana, cuando nadie más está despierto.", w: { penumbra: 3 } },
        { t: "En plena hora pico, con gente por todos lados.", w: { multitud: 3 } },
        { t: "Cuando el cielo se pone gris y se siente que va a llover.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Prueba de valentía",
      dept: "Área de Sorpresas",
      text: "Te tapan los ojos y te llevan a un lugar que no tiene ni letrero en la puerta. ¿Qué haces?",
      options: [
        { t: "Entro feliz. Los mejores lugares no tienen letrero.", w: { penumbra: 3 } },
        { t: "Pido que me vayan contando todo lo que ven.", w: { multitud: 2, pluvia: 1 } },
        { t: "Primero pregunto una sola cosa: si hay techo.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Tema: tus talentos",
      dept: "Área de Talentos",
      text: "¿Cuál de estos es tu mejor talento?",
      options: [
        { t: "Notar detalles chiquitos que nadie más nota.", w: { penumbra: 3 } },
        { t: "No perder el equilibrio ni cuando todo se está moviendo.", w: { multitud: 3 } },
        { t: "Tener toda la paciencia del mundo para esperar.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Tema: la gente",
      dept: "Área de Multitudes",
      text: "Cuando hay muchísima gente alrededor, ¿cómo te sientes?",
      options: [
        { t: "Prefiero poca gente y una buena conversación.", w: { penumbra: 3 } },
        { t: "Feliz. Me gusta ver gente por todos lados.", w: { multitud: 4 } },
        { t: "Tranquila: si empieza a llover, todos se van y listo.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Tema: fotos",
      dept: "Área de Fotografía",
      text: "Te paso mi celular y tienes treinta segundos. ¿Qué foto tomas?",
      options: [
        { t: "Algo sencillo sobre una mesa, con luz de vela.", w: { penumbra: 3 } },
        { t: "Caras. Muchas caras, y ninguna posando.", w: { multitud: 4 } },
        { t: "El cielo reflejado en un charco de la calle.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Escoge uno",
      dept: "Área de Vasos y Tazas",
      text: "Escoge uno. No preguntes para qué.",
      options: [
        { t: "Una taza vieja, de esas que ya tienen historia.", w: { penumbra: 3 } },
        { t: "Un vaso que pueda llevar en una mano mientras me agarro con la otra.", w: { multitud: 3 } },
        { t: "Un frasco de vidrio bien limpio y con etiqueta.", w: { pluvia: 4 } }
      ]
    },
    {
      tag: "Prueba de confianza",
      dept: "Área de Confianza",
      text: "Te digo: «confía en mí, esto es mejor de lo que parece». ¿Qué haces?",
      options: [
        { t: "Cierro los ojos y pruebo.", w: { penumbra: 4 } },
        { t: "Te digo que pruebes tú primero. Y te grabo.", w: { multitud: 3 } },
        { t: "Pregunto qué es, de dónde salió y quién lo hizo.", w: { pluvia: 3 } }
      ]
    },
    {
      tag: "Una sola palabra",
      dept: "Área de Bogotá",
      text: "Bogotá en una sola palabra. Rápido, sin pensarlo.",
      options: [
        { t: "Escondida.", w: { penumbra: 4 } },
        { t: "Movida.", w: { multitud: 4 } },
        { t: "Nublada.", w: { pluvia: 4 } }
      ]
    },
    {
      tag: "Tema: lo romántico",
      dept: "Área del Amor",
      text: "¿Qué te parece más romántico?",
      options: [
        { t: "Compartir algo calientico en un lugar escondido.", w: { penumbra: 4 } },
        { t: "Mirarnos a los ojos con doscientos desconocidos alrededor.", w: { multitud: 4 } },
        { t: "Mojarnos los dos y no salir corriendo a buscar techo.", w: { pluvia: 4 } }
      ]
    },
    {
      tag: "Última pregunta",
      dept: "Gerencia del Cumpleaños",
      text: "La última, y es la más importante: si todo esto fuera una trampa, ¿qué harías?",
      options: [
        { t: "Caigo igual, porque confío en ti.", w: { penumbra: 2, multitud: 1, pluvia: 1 } },
        { t: "Ya me di cuenta hace rato y seguí jugando de todas formas.", w: { multitud: 2, penumbra: 1 } },
        { t: "Sigo jugando, pero después me explicas todo con calma.", w: { pluvia: 2, multitud: 1 } }
      ]
    }
  ];

  var LOAD_MESSAGES = [
    "Inicializando el algoritmo del amor…",
    "Cruzando tus respuestas con la base de datos de tus antojos…",
    "Calibrando el índice de romanticismo aplicado…",
    "Consultando a un comité de expertos que no existe…",
    "Descartando dos planes por exceso de sensatez…",
    "Verificando el pronóstico del clima emocional…",
    "Compilando resultados con 99.9% de rigor inventado…",
    "Listo. Respira, mi amor."
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

  /* =========================================================
     4. UTILIDADES DE DOM
     ========================================================= */
  function $(id) { return document.getElementById(id); }

  var el = {};

  function showScreen(id) {
    var next = $(id);
    var cur = document.querySelector(".screen.is-visible");
    if (!next || cur === next) return;

    if (!cur) {
      next.classList.add("is-visible", "is-in");
      return;
    }
    cur.classList.add("is-out");
    setTimeout(function () {
      cur.classList.remove("is-visible", "is-in", "is-out");
      next.classList.add("is-visible", "is-in");
      // Salto instantáneo al cambiar de pantalla: un scroll animado aquí
      // pelea con el dedo del usuario y da la sensación de no poder subir.
      window.scrollTo(0, 0);
    }, 340);
  }

  /* =========================================================
     5. CORAZONES DE FONDO
     ========================================================= */
  function buildHearts() {
    var host = $("hearts");
    if (!host) return;
    var glyphs = ["💗", "💖", "✦", "💞", "✧", "🩷", "💫"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 16; i++) {
      var h = document.createElement("i");
      h.textContent = glyphs[i % glyphs.length];
      h.style.left = (Math.random() * 98).toFixed(2) + "%";
      h.style.setProperty("--s", (11 + Math.random() * 20).toFixed(0) + "px");
      h.style.setProperty("--d", (13 + Math.random() * 14).toFixed(1) + "s");
      h.style.setProperty("--dl", (Math.random() * 20).toFixed(1) + "s");
      frag.appendChild(h);
    }
    host.appendChild(frag);
  }

  /* =========================================================
     6. RENDER DE PREGUNTAS
     ========================================================= */
  function renderQuestion() {
    var q = QUESTIONS[state.index];
    var total = QUESTIONS.length;

    el.qCounter.textContent = "Pregunta " + (state.index + 1) + " de " + total;
    el.qDept.textContent = q.dept;
    el.qTag.textContent = q.tag;
    el.qText.textContent = q.text;
    el.qProgress.style.width = ((state.index) / total * 100) + "%";

    el.qOptions.innerHTML = "";
    q.options.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "opt";
      b.dataset.i = String(i);

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

    // Restaurar respuesta previa si el usuario volvió atrás
    var prev = state.answers[state.index];
    if (prev !== null && prev !== undefined) {
      var node = el.qOptions.children[prev];
      if (node) node.classList.add("is-selected");
    }

    el.btnBack.disabled = state.index === 0;
    el.btnNext.disabled = prev === null || prev === undefined;
    el.btnNextLabel.textContent =
      state.index === total - 1 ? "Ver mi resultado" : "Siguiente";

    // Animación de entrada en cascada de las opciones
    Array.prototype.forEach.call(el.qOptions.children, function (node, i) {
      node.style.opacity = "0";
      node.style.transform = "translateY(14px)";
      later(function () {
        node.style.transition = "opacity .45s ease, transform .45s cubic-bezier(.22,1,.36,1)";
        node.style.opacity = "";
        node.style.transform = "";
        later(function () { node.style.transition = ""; }, 520);
      }, 90 + i * 85);
    });

    state.lock = false;
  }

  function pick(i) {
    if (state.lock) return;
    state.answers[state.index] = i;

    Array.prototype.forEach.call(el.qOptions.children, function (node, n) {
      node.classList.toggle("is-selected", n === i);
    });

    el.btnNext.disabled = false;
    state.lock = true;

    later(function () {
      state.lock = false;
      goNext();
    }, 780);
  }

  function goNext() {
    if (state.answers[state.index] === null) return;
    clearTimers();
    state.lock = true;

    if (state.index < QUESTIONS.length - 1) {
      state.index++;
      el.qProgress.style.width = (state.index / QUESTIONS.length * 100) + "%";
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
    body.style.transition = "opacity .22s ease, transform .22s ease";
    body.style.opacity = "0";
    body.style.transform = "translateY(-10px)";
    setTimeout(function () {
      fn();
      body.style.opacity = "";
      body.style.transform = "";
      setTimeout(function () { body.style.transition = ""; }, 260);
    }, 230);
  }

  /* =========================================================
     7. CÁLCULO
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
    var keys = Object.keys(state.scores);
    var best = keys[0];
    keys.forEach(function (k) {
      if (state.scores[k] > state.scores[best]) best = k;
    });
    return best;
  }

  /* =========================================================
     8. PANTALLA DE CARGA
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

    setTimeout(function () {
      el.loadBar.style.transition = "width .25s linear";
    }, 40);

    // setInterval (y no requestAnimationFrame) para que la barra no se
    // congele si la pestaña queda en segundo plano a mitad del suspenso.
    var iv = setInterval(function () {
      var t = Math.min((Date.now() - start) / DURATION, 1);
      var pct = Math.round(t * 100);
      el.loadBar.style.width = pct + "%";
      el.loadPct.textContent = pct + "%";

      var wantIdx = Math.min(
        LOAD_MESSAGES.length - 1,
        Math.floor(t * LOAD_MESSAGES.length)
      );
      if (wantIdx !== msgIdx) {
        msgIdx = wantIdx;
        el.loadStatus.textContent = LOAD_MESSAGES[msgIdx];
        el.loadStatus.style.animation = "none";
        void el.loadStatus.offsetWidth;
        el.loadStatus.style.animation = "";
      }

      if (t >= 1) {
        clearInterval(iv);
        later(showResult, 320);
      }
    }, 80);
    timers.push(iv);
  }

  /* =========================================================
     9. PANTALLA DE RESULTADO
     ========================================================= */
  function showResult() {
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

    // Barras de afinidad (sin revelar nada, solo para el show)
    var totalPts = 0;
    Object.keys(state.scores).forEach(function (k) { totalPts += state.scores[k]; });
    if (totalPts === 0) totalPts = 1;

    el.scoreBars.innerHTML = "";
    var rows = [];
    Object.keys(SCORE_LABELS).forEach(function (k) {
      var pct = Math.round(state.scores[k] / totalPts * 100);
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

    el.twistBlock.hidden = true;
    el.inviteBlock.hidden = true;

    showScreen("screen-result");

    later(function () {
      rows.forEach(function (r) { r.node.style.width = r.pct + "%"; });
    }, 700);

    // El giro: dejarla procesar la locura y luego romper la ilusión.
    // Nada de scroll automático aquí: aparece abajo y ella baja cuando quiera.
    later(function () {
      el.twistBlock.hidden = false;
      showHint();
    }, 7200);

    later(function () {
      el.inviteBlock.hidden = false;
    }, 10400);
  }

  /* Aviso discreto de "hay más abajo", ya que no movemos la página sola */
  function showHint() {
    var hint = $("scrollHint");
    if (!hint) return;

    // Si el bloque ya se ve completo, no hace falta avisar nada.
    var r = el.twistBlock.getBoundingClientRect();
    if (r.top < window.innerHeight - 60) return;

    hint.hidden = false;
    hint.classList.add("is-on");

    function dismiss() {
      hint.classList.remove("is-on");
      window.removeEventListener("scroll", dismiss);
      later(function () { hint.hidden = true; }, 400);
    }
    window.addEventListener("scroll", dismiss, { passive: true });
    later(dismiss, 9000);
  }

  /* =========================================================
     10. REINICIO
     ========================================================= */
  function restart() {
    clearTimers();
    state.index = 0;
    state.answers = new Array(QUESTIONS.length).fill(null);
    state.scores = { penumbra: 0, multitud: 0, pluvia: 0 };
    state.lock = false;
    el.twistBlock.hidden = true;
    el.inviteBlock.hidden = true;
    var hint = $("scrollHint");
    if (hint) { hint.classList.remove("is-on"); hint.hidden = true; }
    renderQuestion();
    showScreen("screen-quiz");
  }

  /* =========================================================
     11. ARRANQUE
     ========================================================= */
  function init() {
    el = {
      qCounter:   $("qCounter"),
      qDept:      $("qDept"),
      qTag:       $("qTag"),
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
      scoreBars:  $("scoreBars"),
      twistBlock: $("twistBlock"),
      inviteBlock:$("inviteBlock")
    };

    buildHearts();
    showScreen("screen-intro");

    // La música arranca con el PRIMER clic en cualquier parte de la página
    function firstTouch() {
      AudioEngine.start();
      document.removeEventListener("pointerdown", firstTouch, true);
      document.removeEventListener("click", firstTouch, true);
      document.removeEventListener("keydown", firstTouch, true);
      document.removeEventListener("touchstart", firstTouch, true);
    }
    document.addEventListener("pointerdown", firstTouch, true);
    document.addEventListener("click", firstTouch, true);
    document.addEventListener("keydown", firstTouch, true);
    document.addEventListener("touchstart", firstTouch, true);

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
    $("btnRestart").addEventListener("click", restart);

    // Atajos de teclado: 1/2/3 o A/B/C
    document.addEventListener("keydown", function (e) {
      var quizVisible = $("screen-quiz").classList.contains("is-visible");
      if (!quizVisible) return;
      var map = { "1": 0, "2": 1, "3": 2, "4": 3,
                  a: 0, b: 1, c: 2, d: 3 };
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
