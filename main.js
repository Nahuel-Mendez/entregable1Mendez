// Este proyecto quiere simular lo que seria una aplicacion de bancos, teniendo en cuenta el registro de usuario, el saldo de cuenta, y movimientos de la misma

// Variables y constantes

let saldo = 0;
const movimientos = [];

// funcion 1: registro

function registrarUsuario() {
  const nombre = prompt('Ingrese su nombre:');
  alert(`Hola ${nombre}, bienvendido a nuestro banco`);
  console.log(`Usuario registrado: ${nombre}`);
  return nombre;
}

// funcion 2: depositar

function depositar() {
  let monto = parseFloat(prompt('Ingrese el valor que quiera depositar'));
  if (isNaN(monto) || monto <= 0) {
    alert('Monto invalido.');
    console.log('Intento de deposito invalido.');
    return;
  }
  saldo += monto;
  movimientos.push({ tipo: 'Deposito', monto });
  alert(`Deposito exitoso. Saldo actual: $${saldo}`);
  console.log(`Deposito de $${monto}. Saldo actual: $${saldo}`);
}

// funcion 3 : retirar

function retirar() {
  let monto = parseFloat(prompt('Cuanto queres retirar?'));
  if (isNaN(monto) || monto <= 0) {
    alert('Monto invalido');
    console.log('Intento de retiro invalido');
    return;
  }

  if (monto > saldo) {
    alert('Saldo insuficiente.');
    console.log(`Retiro fallido. Saldo insuficiente para retirar $${monto}`);
    return;
  }
}

// funcion 4 : ver resumen

function mostrarMovimientos() {
  console.log('Movimientos');
  movimientos.forEach((mov, i) => {
    console.log(`${i + 1}. ${mov.tipo}: $${mov.monto}`);
  });
  console.log(`Saldo final: $${saldo}`);
  alert('Movimientos mostrados en consola');
}

// ciclo principal

function iniciarSimulador() {
  const usuario = registrarUsuario();

  let seguir = true;

  while (seguir) {
    const opcion = prompt(
      'Selecciona una opcion: \n1 - Consultar saldo \n2 - Depositar \n3 - Retirar\n4 - Ver Movimientos\n5 - salir'
    );

    switch (opcion) {
      case '1':
        alert(`saldo actual: $${saldo}`);
        console.log(`Consulta de saldo: $${saldo}`);
        break;
      case '2':
        depositar();
        break;
      case '3':
        retirar();
        break;
      case '4':
        mostrarMovimientos();
        break;
      case '5':
        alert('Gracias por confiar en nuestro banco. Vuelva pronto');
        console.log('Movimientos finalizados.');
        seguir = false;
        break;
      default:
        alert('Opcion invalida.');
        console.log(`Entrada invalida: ${opcion}`);
    }
  }
}

iniciarSimulador();
