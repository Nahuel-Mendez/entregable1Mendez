// Banco JS — Simulador con DOM, Eventos y LocalStorage
(() => {
  // ======= Persistencia =======
  const KEY = 'bankApp_v1';

  const estado = leerEstado() ?? {
    usuario: null, // { id, nombre }
    saldo: 0, // número
    movimientos: [], // [{ id, tipo, monto, concepto, fechaISO }]
  };

  function guardarEstado() {
    localStorage.setItem(KEY, JSON.stringify(estado));
  }
  function leerEstado() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ======= Helpers =======
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const $panelNoUsuario = $('#panelNoUsuario');
  const $panelUsuario = $('#panelUsuario');
  const $lblUsuario = $('#lblUsuario');
  const $lblUsuarioId = $('#lblUsuarioId');
  const $lblSaldo = $('#lblSaldo');
  const $formRegistro = $('#formRegistro');
  const $btnCerrarSesion = $('#btnCerrarSesion');
  const $formDeposito = $('#formDeposito');
  const $formRetiro = $('#formRetiro');

  const $buscador = $('#buscador');
  const $filtroTipo = $('#filtroTipo');
  const $btnLimpiarMovs = $('#btnLimpiarMovs');
  const $listaMovimientos = $('#listaMovimientos');
  const $lblCantidad = $('#lblCantidad');
  const $lblAcumulado = $('#lblAcumulado');

  function formatearMoneda(n) {
    return n.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    });
  }
  function nowISO() {
    return new Date().toISOString();
  }
  function generarId(lista) {
    const max = lista.reduce((a, x) => Math.max(a, x.id), 0);
    return max + 1;
  }

  // Movimientos , y funcionalidades como barra de busqueda de movimientos

  function render() {
    if (!estado.usuario) {
      $panelNoUsuario.classList.remove('hidden');
      $panelUsuario.classList.add('hidden');
      $listaMovimientos.innerHTML = '';
      $lblCantidad.textContent = '0 movimientos';
      $lblAcumulado.textContent = formatearMoneda(0);
      return;
    }

    $panelNoUsuario.classList.add('hidden');
    $panelUsuario.classList.remove('hidden');

    $lblUsuario.textContent = `Hola, ${estado.usuario.nombre}`;
    $lblUsuarioId.textContent = estado.usuario.id;
    $lblSaldo.textContent = formatearMoneda(estado.saldo);

    renderMovimientos();
  }

  function renderMovimientos() {
    const texto = $buscador.value.trim().toLowerCase();
    const tipo = $filtroTipo.value;

    const filtrados = estado.movimientos
      .filter((m) => (tipo ? m.tipo === tipo : true))
      .filter((m) =>
        texto ? (m.concepto || '').toLowerCase().includes(texto) : true
      )
      .sort((a, b) => b.id - a.id);

    $listaMovimientos.innerHTML = '';
    if (filtrados.length === 0) {
      const li = document.createElement('li');
      li.className = 'item';
      li.innerHTML = `<span class="muted">No hay movimientos para mostrar.</span>`;
      $listaMovimientos.append(li);
    } else {
      $listaMovimientos.append(...filtrados.map(itemMovimiento));
    }

    // acumulado (depósitos positivos, retiros negativos)
    const acumulado = filtrados.reduce(
      (acc, m) => acc + (m.tipo === 'Deposito' ? m.monto : -m.monto),
      0
    );
    $lblCantidad.textContent = `${filtrados.length} ${
      filtrados.length === 1 ? 'movimiento' : 'movimientos'
    }`;
    $lblAcumulado.textContent = formatearMoneda(acumulado);
  }

  function itemMovimiento(m) {
    const li = document.createElement('li');
    li.className = 'item';
    const signo = m.tipo === 'Deposito' ? '+' : '-';
    const badgeClass = m.tipo === 'Deposito' ? 'ok' : 'warn';
    const fecha = new Date(m.fechaISO).toLocaleString('es-AR');
    li.innerHTML = `
      <div>
        <div><span class="badge ${badgeClass}">${m.tipo}</span> ${
      m.concepto ? '· ' + escapar(m.concepto) : ''
    }</div>
        <div class="muted">${fecha}</div>
      </div>
      <strong>${signo} ${formatearMoneda(m.monto)}</strong>
      <button class="ghost" aria-label="Eliminar">🗑️</button>
    `;
    li.querySelector('button').addEventListener('click', () => {
      estado.movimientos = estado.movimientos.filter((x) => x.id !== m.id);
      guardarEstado();
      render();
    });
    return li;
  }

  //  Acciones
  $formRegistro.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData($formRegistro);
    const nombre = (data.get('nombre') || '').toString().trim();
    if (!nombre) return;

    estado.usuario = { id: cryptoRandomId(), nombre };
    estado.saldo = 0;
    estado.movimientos = [];
    guardarEstado();
    $formRegistro.reset();
    render();
  });

  // solo desloguea pero queda guardado
  $btnCerrarSesion.addEventListener('click', () => {
    if (!confirm('¿Cerrar sesión? Se mantendrán tus datos guardados.')) return;
    estado.usuario = null;
    guardarEstado();
    render();
  });

  $formDeposito.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!estado.usuario) return;
    const data = new FormData($formDeposito);
    const monto = Number(data.get('monto'));
    if (!Number.isFinite(monto) || monto <= 0) {
      alert('Monto inválido.');
      return;
    }
    estado.saldo += monto;
    estado.movimientos.push({
      id: generarId(estado.movimientos),
      tipo: 'Deposito',
      monto,
      concepto: 'Depósito en cuenta',
      fechaISO: nowISO(),
    });
    guardarEstado();
    $formDeposito.reset();
    render();
  });

  $formRetiro.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!estado.usuario) return;
    const data = new FormData($formRetiro);
    const monto = Number(data.get('monto'));
    if (!Number.isFinite(monto) || monto <= 0) {
      alert('Monto inválido.');
      return;
    }
    if (monto > estado.saldo) {
      alert('Saldo insuficiente.');
      return;
    }
    estado.saldo -= monto;
    estado.movimientos.push({
      id: generarId(estado.movimientos),
      tipo: 'Retiro',
      monto,
      concepto: 'Retiro de efectivo',
      fechaISO: nowISO(),
    });
    guardarEstado();
    $formRetiro.reset();
    render();
  });

  $buscador.addEventListener('input', renderMovimientos);
  $filtroTipo.addEventListener('change', renderMovimientos);

  $btnLimpiarMovs.addEventListener('click', () => {
    if (!estado.usuario) return;
    if (!confirm('¿Eliminar todo el historial de movimientos?')) return;
    estado.movimientos = [];
    guardarEstado();
    render();
  });

  // ======= Util =======
  function escapar(str) {
    return String(str).replace(
      /[&<>"']/g,
      (s) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        }[s])
    );
  }

  function cryptoRandomId() {
    // ID legible y corto
    const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
    const n = Date.now().toString(36).toUpperCase().slice(-4);
    return `${n}-${rnd}`;
  }

  // Init
  render();
})();
