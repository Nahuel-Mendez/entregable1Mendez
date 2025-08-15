// // Este proyecto quiere simular lo que seria una aplicacion de bancos, teniendo en cuenta el registro de usuario, el saldo de cuenta, y movimientos de la misma

// // Variables y constantes

// let saldo = 0;
// const movimientos = [];

// // funcion 1: registro

// function registrarUsuario() {
//   const nombre = prompt('Ingrese su nombre:');
//   alert(`Hola ${nombre}, bienvendido a nuestro banco`);
//   console.log(`Usuario registrado: ${nombre}`);
//   return nombre;
// }

// // funcion 2: depositar

// function depositar() {
//   let monto = parseFloat(prompt('Ingrese el valor que quiera depositar'));
//   if (isNaN(monto) || monto <= 0) {
//     alert('Monto invalido.');
//     console.log('Intento de deposito invalido.');
//     return;
//   }
//   saldo += monto;
//   movimientos.push({ tipo: 'Deposito', monto });
//   alert(`Deposito exitoso. Saldo actual: $${saldo}`);
//   console.log(`Deposito de $${monto}. Saldo actual: $${saldo}`);
// }

// // funcion 3 : retirar

// function retirar() {
//   let monto = parseFloat(prompt('Cuanto queres retirar?'));
//   if (isNaN(monto) || monto <= 0) {
//     alert('Monto invalido');
//     console.log('Intento de retiro invalido');
//     return;
//   }

//   if (monto > saldo) {
//     alert('Saldo insuficiente.');
//     console.log(`Retiro fallido. Saldo insuficiente para retirar $${monto}`);
//     return;
//   }
// }

// // funcion 4 : ver resumen

// function mostrarMovimientos() {
//   console.log('Movimientos');
//   movimientos.forEach((mov, i) => {
//     console.log(`${i + 1}. ${mov.tipo}: $${mov.monto}`);
//   });
//   console.log(`Saldo final: $${saldo}`);
//   alert('Movimientos mostrados en consola');
// }

// // ciclo principal

// function iniciarSimulador() {
//   const usuario = registrarUsuario();

//   let seguir = true;

//   while (seguir) {
//     const opcion = prompt(
//       'Selecciona una opcion: \n1 - Consultar saldo \n2 - Depositar \n3 - Retirar\n4 - Ver Movimientos\n5 - salir'
//     );

//     switch (opcion) {
//       case '1':
//         alert(`saldo actual: $${saldo}`);
//         console.log(`Consulta de saldo: $${saldo}`);
//         break;
//       case '2':
//         depositar();
//         break;
//       case '3':
//         retirar();
//         break;
//       case '4':
//         mostrarMovimientos();
//         break;
//       case '5':
//         alert('Gracias por confiar en nuestro banco. Vuelva pronto');
//         console.log('Movimientos finalizados.');
//         seguir = false;
//         break;
//       default:
//         alert('Opcion invalida.');
//         console.log(`Entrada invalida: ${opcion}`);
//     }
//   }
// }

// iniciarSimulador();

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

  // Variables utilizando selectores rapidos

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
    return n.toLocaleString('es-UY', {
      style: 'currency',
      currency: 'UY',
      minimumFractionDigits: 2,
    });
  }

  // Funcion para devolver la fecha
  function nowISO() {
    return new Date().toISOString();
  }

  // Funcion para agregarle un id a unico
  function generarId(lista) {
    const max = lista.reduce((a, x) => Math.max(a, x.id), 0);
    return max + 1;
  }

  // Renderizado

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
      .sort((a, b) => b.id - a.id); // los últimos primero

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

  // ======= Acciones =======
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

  $btnCerrarSesion.addEventListener('click', () => {
    if (!confirm('¿Cerrar sesión? Se mantendrán tus datos guardados.')) return;
    // sólo desloguea, no borra datos
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
