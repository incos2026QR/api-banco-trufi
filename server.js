const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// 1. BASE DE DATOS EN MEMORIA (Inicia con 2 cuentas de prueba)
const cuentasBancarias = {
  "CTA-1001": { titular: "Pasajero Juan", saldo: 50.00 },
  "CTA-2002": { titular: "Chofer Pedro", saldo: 10.00 }
};

const transacciones = [];

// 2. ENDPOINT: Crear una nueva cuenta bancaria
app.post('/api/banco/crear-cuenta', (req, res) => {
  const { cuentaId, titular, saldoInicial } = req.body;

  if (!cuentaId || !titular) {
    return res.status(400).json({ ok: false, mensaje: "Falta cuentaId o titular" });
  }

  if (cuentasBancarias[cuentaId]) {
    return res.status(400).json({ ok: false, mensaje: "La cuenta ya existe" });
  }

  // Asigna el saldo recibido, o 50.00 Bs por defecto si no envían nada
  const saldoAsignado = (saldoInicial !== undefined && !isNaN(parseFloat(saldoInicial))) 
    ? parseFloat(saldoInicial) 
    : 50.00;

  cuentasBancarias[cuentaId] = {
    titular: titular,
    saldo: saldoAsignado
  };

  res.status(201).json({
    ok: true,
    mensaje: "Cuenta creada exitosamente",
    cuenta: cuentasBancarias[cuentaId]
  });
});

// 3. ENDPOINT: Ver TODAS las cuentas registradas
app.get('/api/banco/cuentas', (req, res) => {
  res.json({ ok: true, cuentas: cuentasBancarias });
});

// 4. ENDPOINT: Consultar saldo de una cuenta especifica
app.get('/api/banco/saldo/:cuentaId', (req, res) => {
  const { cuentaId } = req.params;
  const cuenta = cuentasBancarias[cuentaId];

  if (!cuenta) {
    return res.status(404).json({ ok: false, mensaje: "Cuenta no encontrada" });
  }

  res.json({ ok: true, cuenta: cuentaId, titular: cuenta.titular, saldo: cuenta.saldo });
});

// 5. ENDPOINT: Recargar saldo
app.post('/api/banco/recargar', (req, res) => {
  const { cuentaId, monto } = req.body;

  if (!cuentasBancarias[cuentaId]) {
    return res.status(404).json({ ok: false, mensaje: "La cuenta no existe" });
  }
  if (!monto || monto <= 0) {
    return res.status(400).json({ ok: false, mensaje: "Monto inválido" });
  }

  cuentasBancarias[cuentaId].saldo += parseFloat(monto);

  res.json({
    ok: true,
    mensaje: "Recarga exitosa",
    nuevoSaldo: cuentasBancarias[cuentaId].saldo
  });
});

// 6. ENDPOINT PRINCIPAL: Procesar Cobro de Pasaje
app.post('/api/banco/pagar-pasaje', (req, res) => {
  const { cuentaOrigen, cuentaDestino, monto, tarifaTipo, cantidadPasajes, latitud, longitud } = req.body;

  const origen = cuentasBancarias[cuentaOrigen];
  const destino = cuentasBancarias[cuentaDestino];

  if (!origen || !destino) {
    return res.status(404).json({ ok: false, mensaje: "Una de las cuentas bancarias no existe" });
  }

  if (origen.saldo < monto) {
    return res.status(400).json({
      ok: false,
      codigo: "SALDO_INSUFICIENTE",
      mensaje: "Fondos insuficientes para realizar el pago del pasaje"
    });
  }

  origen.saldo -= parseFloat(monto);
  destino.saldo += parseFloat(monto);

  const nuevaTransaccion = {
    id: "TXN-" + Date.now(),
    cuentaOrigen,
    cuentaDestino,
    montoProcesado: monto,
    tarifaTipo,
    cantidadPasajes,
    gps: { latitud, longitud },
    fecha: new Date().toISOString()
  };

  transacciones.push(nuevaTransaccion);

  res.status(200).json({
    ok: true,
    mensaje: "Cobro completado con éxito",
    transaccion: nuevaTransaccion,
    saldoRestanteOrigen: origen.saldo
  });
});

// Configuración del Puerto para Render/Producción o Local (3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API Bancaria Simulada ejecutándose en el puerto ${PORT}`);
});