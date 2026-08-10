const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Base de datos en memoria para el banco simulado
const cuentasBancarias = {};

// 1. Obtener todas las cuentas (Panel / Depuración)
app.get('/api/banco/cuentas', (req, res) => {
  res.json({ ok: true, cuentas: cuentasBancarias });
});

// 2. Crear una nueva cuenta bancaria
app.post('/api/banco/crear-cuenta', (req, res) => {
  const { cuentaId, titular, saldoInicial } = req.body;

  if (!cuentaId || !titular) {
    return res.status(400).json({ ok: false, mensaje: "Falta cuentaId o titular" });
  }

  if (cuentasBancarias[cuentaId]) {
    return res.status(400).json({ ok: false, mensaje: "La cuenta ya existe" });
  }

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

// 3. Consultar saldo de una cuenta
app.get('/api/banco/saldo/:cuentaId', (req, res) => {
  const { cuentaId } = req.params;
  const cuenta = cuentasBancarias[cuentaId];

  if (!cuenta) {
    return res.status(404).json({ ok: false, mensaje: "Cuenta bancaria no encontrada" });
  }

  res.json({
    ok: true,
    cuenta: cuentaId,
    titular: cuenta.titular,
    saldo: cuenta.saldo
  });
});

// 4. Recargar Saldo en la App (RESTAR/DEBITAR del Banco)
app.post('/api/banco/recargar', (req, res) => {
  const { cuentaId, monto } = req.body;
  const montoNum = parseFloat(monto);

  if (!cuentaId || isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ ok: false, mensaje: "Cuenta ID o monto inválido" });
  }

  const cuenta = cuentasBancarias[cuentaId];
  if (!cuenta) {
    return res.status(404).json({ ok: false, mensaje: "Cuenta bancaria no encontrada" });
  }

  // Verificar si el banco tiene fondos para hacer la recarga
  if (cuenta.saldo < montoNum) {
    return res.status(400).json({ ok: false, mensaje: "Saldo bancario insuficiente para esta recarga" });
  }

  // CORRECCIÓN: Restar del banco porque el dinero pasa a la App
  cuenta.saldo -= montoNum;

  res.json({
    ok: true,
    mensaje: "Recarga procesada exitosamente. Fondos debitados del banco.",
    nuevoSaldo: cuenta.saldo
  });
});

// 5. Retirar Ganancias del Chofer (SUMAR/ACREDITAR al Banco)
app.post('/api/banco/retirar-ganancias', (req, res) => {
  const { cuentaId, monto } = req.body;
  const montoNum = parseFloat(monto);

  if (!cuentaId || isNaN(montoNum) || montoNum <= 0) {
    return res.status(400).json({ ok: false, mensaje: "Cuenta ID o monto inválido" });
  }

  const cuenta = cuentasBancarias[cuentaId];
  if (!cuenta) {
    return res.status(404).json({ ok: false, mensaje: "Cuenta bancaria no encontrada" });
  }

  // Sumar el dinero ganado al banco del chofer
  cuenta.saldo += montoNum;

  res.json({
    ok: true,
    mensaje: "Ganancias transferidas exitosamente a la cuenta bancaria.",
    nuevoSaldo: cuenta.saldo
  });
});

app.listen(PORT, () => {
  console.log(`Servidor de API bancaria ejecutándose en el puerto ${PORT}`);
});