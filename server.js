const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

const CONTROL_PASSWORD = process.env.CONTROL_PASSWORD || 'meridian-control';
const ENGINEER_PASSWORD = process.env.ENGINEER_PASSWORD || 'meridian-engineering';

const subspaceNodes = [
  "SOL-SECTOR RELAY 3","STARBASE 12 MESH","EPSILON INDIRI NODE",
  "ARGELIUS TRANSIT ARRAY","MEMPAK CORRIDOR RELAY","TYCHON SUBSPACE HUB"
];

let state = {
  shipName: "USS MERIDIAN",
  registry: "NCC-0000",
  hull: 100, hullMax: 100,
  shields: 110, shieldsMax: 110,
  alert: "GREEN",
  alerts: { comms:false, sensors:false, tactical:false },
  subsystems: {
    engines:100, weapons:100, sensors:100, comms:100,
    deflector:100, lifesupport:100, transporters:100
  }
};

const startedAt = Date.now();
function pickNode() {
  const i = Math.floor(((Date.now() - startedAt) / 60000) % subspaceNodes.length);
  return subspaceNodes[i];
}
function getLatency() { return 38 + Math.floor(((Date.now() - startedAt) / 1000) % 53); }
function getChannelIntegrity() { return (96 + (((Date.now() - startedAt) / 7000) % 3.5)).toFixed(1); }

function basicAuth(requiredPassword, realm) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
      return res.status(401).send('Authentication required.');
    }
    let decoded = '';
    try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); }
    catch { res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`); return res.status(401).send('Invalid authentication header.'); }
    const idx = decoded.indexOf(':');
    const password = idx >= 0 ? decoded.slice(idx + 1) : '';
    if (password !== requiredPassword) {
      res.setHeader('WWW-Authenticate', `Basic realm="${realm}"`);
      return res.status(401).send('Invalid password.');
    }
    next();
  };
}

app.get('/control.html', basicAuth(CONTROL_PASSWORD, 'USS Meridian Control'), (req, res) => {
  res.sendFile(path.join(__dirname, 'control.html'));
});
app.get('/engineer.html', basicAuth(ENGINEER_PASSWORD, 'USS Meridian Engineer'), (req, res) => {
  res.sendFile(path.join(__dirname, 'engineer.html'));
});

app.get('/status', (req, res) => {
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    subspaceNode: pickNode(),
    latencyMs: getLatency(),
    channelIntegrity: getChannelIntegrity(),
    alert: state.alert,
    hull: state.hull,
    hullMax: state.hullMax,
    shields: state.shields,
    shieldsMax: state.shieldsMax
  });
});

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  socket.emit('update', state);
  socket.on('update', (newState) => {
    state = {
      ...state,
      ...newState,
      alerts: { ...state.alerts, ...(newState.alerts || {}) },
      subsystems: { ...state.subsystems, ...(newState.subsystems || {}) }
    };
    io.emit('update', state);
  });
  socket.on('triggerSound', (payload) => io.emit('soundEvent', payload));
});

server.listen(PORT, () => console.log(`LCARS server running on port ${PORT}`));
