// avisos-web.js — los avisos de Perez en la web (hub y /gdp), para TODO el que tenga la pagina abierta.
// Lee el aviso publicado en GitHub (repo publico perezai-radio, aviso.txt = "id|tipo|segundos|titulo|texto"),
// asi que funciona aunque la PC de Perez este apagada. Saca la misma ventanita que el programita de Windows
// y, si el visitante lo activa, una notificacion del navegador aunque tenga la pestaña en segundo plano.
(function () {
  var API = "https://api.github.com/repos/pruebamk14-dotcom/perezai-radio/contents/aviso.txt";
  var CSS = "#pz-aviso{position:fixed;right:18px;bottom:18px;z-index:99999;width:min(420px,calc(100vw - 36px));background:linear-gradient(180deg,#141a26,#0b0f17);border:1px solid #2a3850;border-left:4px solid var(--pzc,#4da3ff);border-radius:16px;padding:14px 16px 12px 66px;box-shadow:0 24px 70px rgba(0,0,0,.7);font-family:'Segoe UI',system-ui,Arial;color:#e8eef7;transform:translateX(120%);transition:transform .5s cubic-bezier(.2,.9,.2,1)}" +
    "#pz-aviso.on{transform:none}#pz-aviso .ic{position:absolute;left:14px;top:14px;width:40px;height:40px;border-radius:11px;background:var(--pzc,#4da3ff);display:flex;align-items:center;justify-content:center;font-size:21px;box-shadow:0 0 22px var(--pzc,#4da3ff)}" +
    "#pz-aviso .t{font-size:11px;letter-spacing:2.5px;font-weight:800;color:var(--pzc,#4da3ff);text-transform:uppercase}#pz-aviso .x{font-size:14.5px;line-height:1.45;margin-top:3px}#pz-aviso .p{font-size:11px;color:#6f809a;margin-top:8px;display:flex;gap:10px;align-items:center}" +
    "#pz-aviso button{background:none;border:1px solid #2a3850;color:#a0b1c9;border-radius:999px;font-size:11px;padding:3px 9px;cursor:pointer}#pz-aviso .cerrar{position:absolute;right:10px;top:8px;border:0;font-size:15px;padding:2px 6px}" +
    "#pz-campana{position:fixed;right:18px;bottom:18px;z-index:99998;background:rgba(14,19,27,.85);border:1px solid #213046;color:#a0b1c9;border-radius:999px;font:600 12px 'Segoe UI',Arial;padding:7px 13px;cursor:pointer;backdrop-filter:blur(6px)}#pz-campana:hover{color:#e8eef7}";
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

  function visto() { try { return localStorage.getItem("pz_aviso_visto") || ""; } catch (e) { return ""; } }
  function marcar(id) { try { localStorage.setItem("pz_aviso_visto", id); } catch (e) {} }
  function tono() { try { var A = new (window.AudioContext || window.webkitAudioContext)(), t = A.currentTime; [880, 1320].forEach(function (f, i) { var o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + i * .14); g.gain.linearRampToValueAtTime(.08, t + i * .14 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .14 + .35); o.connect(g); g.connect(A.destination); o.start(t + i * .14); o.stop(t + i * .14 + .4); }); } catch (e) {} }

  function mostrar(a) {
    var viejo = document.getElementById("pz-aviso"); if (viejo) viejo.remove();
    var color = a.tipo === "urgente" ? "#ff4d5e" : a.tipo === "actualizacion" ? "#35d17a" : "#4da3ff";
    var d = document.createElement("div"); d.id = "pz-aviso"; d.style.setProperty("--pzc", color);
    var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    d.innerHTML = '<div class="ic">' + (a.tipo === "urgente" ? "🚨" : a.tipo === "actualizacion" ? "⬆️" : "📣") + '</div><button class="cerrar" title="cerrar">✕</button><div class="t">' + esc(a.titulo) + '</div><div class="x">' + esc(a.texto) + '</div><div class="p"><span>AdrianMK · PerezAI</span></div>';
    document.body.appendChild(d);
    d.querySelector(".cerrar").onclick = function () { d.classList.remove("on"); setTimeout(function () { d.remove(); }, 500); };
    requestAnimationFrame(function () { requestAnimationFrame(function () { d.classList.add("on"); }); });
    tono();
    setTimeout(function () { if (d.parentNode) { d.classList.remove("on"); setTimeout(function () { d.remove(); }, 500); } }, 20000);
    try { if ("Notification" in window && Notification.permission === "granted" && document.hidden) new Notification(a.titulo, { body: a.texto, tag: a.id }); } catch (e) {}
  }

  function mirar(forzar) {
    fetch(API + "?t=" + Date.now(), { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.content) return;
        var linea = ""; try { linea = decodeURIComponent(escape(atob(j.content.replace(/\n/g, "")))).trim(); } catch (e) { return; }
        if (!linea) return;
        var p = linea.split("|"); if (p.length < 5) return;
        var a = { id: p[0], tipo: p[1], titulo: p[3], texto: p.slice(4).join("|") };
        if (!forzar && a.id === visto()) return;
        marcar(a.id); mostrar(a);
      }).catch(function () {});
  }

  // la campanita: pide permiso de notificaciones del navegador (pa' que salgan con la pestaña en segundo plano)
  function campana() {
    if (!("Notification" in window) || Notification.permission !== "default") return;
    var b = document.createElement("button"); b.id = "pz-campana"; b.textContent = "🔔 Activar avisos de Perez";
    b.onclick = function () { Notification.requestPermission().then(function () { b.remove(); mirar(true); }); };
    document.body.appendChild(b);
  }

  setTimeout(function () { mirar(false); campana(); }, 2500);
  setInterval(function () { mirar(false); }, 90000);   // GitHub deja 60 consultas por hora sin cuenta
  window.PerezAvisos = { mirar: mirar };
})();
