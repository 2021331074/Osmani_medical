'use strict';

// Osmani Medical College Hospita
// l COllege Hospital — local static server + ChatterMate API proxy
// Uses only built-in Node.js modules. Keep .env beside this file and never share it.
// Run with: node --env-file=.env server.js

const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const API_KEY = process.env.CHATTERMATE_API_KEY;
const MAX_BODY_BYTES = 1_000_000;
const API_HOST = 'chattermate.ai';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const SYSTEM_PROMPT =
  "You are a hospital report assistant. Answer only from the report data given. " +
  "Never invent numbers. If the data doesn't have the answer, say so. Money is in Taka (Tk). " +
  "Keep answers short. You cannot change any data; refuse requests to edit or delete.";

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Request body is too large.'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Request body must be valid JSON.'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requestChatterMate(method, route, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
    const req = https.request({
      hostname: API_HOST,
      path: route,
      method,
      headers: {
        'X-API-Key': API_KEY,
        'Accept': 'application/json',
        ...(payload ? {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        } : {})
      },
      timeout: 45_000
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const err = new Error(`ChatterMate returned HTTP ${response.statusCode}.`);
          err.statusCode = response.statusCode;
          err.responseText = text.slice(0, 1000);
          reject(err);
          return;
        }
        resolve(text);
      });
    });
    req.on('timeout', () => req.destroy(new Error('ChatterMate request timed out.')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function parseModelChunkStream(text) {
  const pieces = [];
  let currentEvent = '';
  let dataLines = [];

  function consumeEvent() {
    if (currentEvent === 'model_chunk') {
      const raw = dataLines.join('\n');
      if (raw && raw !== '[DONE]') {
        try {
          const chunk = JSON.parse(raw);
          if (typeof chunk.content === 'string') pieces.push(chunk.content);
        } catch {
          // Ignore non-JSON SSE messages; only model_chunk content is used.
        }
      }
    }
    currentEvent = '';
    dataLines = [];
  }

  for (const line of text.split(/\r?\n/)) {
    if (line === '') {
      consumeEvent();
    } else if (line.startsWith('event:')) {
      currentEvent = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  consumeEvent();
  return pieces.join('');
}

async function answerQuestion(question, reportData) {
  const modelsText = await requestChatterMate('GET', '/api/chat/models');
  let modelsJson;
  try {
    modelsJson = JSON.parse(modelsText);
  } catch {
    throw new Error('Could not read the ChatterMate model response.');
  }
  const modelId = modelsJson.default_model_id;
  if (!modelId) throw new Error('No default_model_id was returned by ChatterMate.');

  const streamText = await requestChatterMate('POST', '/api/chat/stream', {
    models: [modelId],
    system_prompt: SYSTEM_PROMPT,
    prompt: `Report data (JSON): ${JSON.stringify(reportData)}\nQuestion: ${question}`
  });
  const answer = parseModelChunkStream(streamText).trim();
  if (!answer) throw new Error('ChatterMate returned no answer text.');
  return answer;
}

async function handleAsk(req, res) {
  if (!API_KEY) {
    sendJson(res, 500, { error: 'CHATTERMATE_API_KEY is missing. Add it to .env and restart the server.' });
    return;
  }

  let input;
  try {
    input = await readJsonBody(req);
  } catch (err) {
    if (!res.headersSent && !res.destroyed) {
      sendJson(res, err.statusCode || 400, { error: err.message || 'Could not read request.' });
    }
    return;
  }

  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (!question) {
    sendJson(res, 400, { error: 'Enter a question about the reports.' });
    return;
  }
  if (question.length > 2000) {
    sendJson(res, 400, { error: 'Question is too long (maximum 2,000 characters).' });
    return;
  }
  const reportData = input.data;
  if (reportData === undefined || reportData === null || typeof reportData !== 'object') {
    sendJson(res, 400, { error: 'Include report data as an object in the request.' });
    return;
  }

  try {
    const answer = await answerQuestion(question, reportData);
    sendJson(res, 200, { answer });
  } catch (err) {
    console.error('ChatterMate request failed:', err.message);
    // Do not return upstream response text or secrets to the browser.
    const status = err.statusCode === 401 ? 502 : 502;
    sendJson(res, status, {
      error: 'Could not get an answer from ChatterMate. Check the API key, connection, and server terminal output.'
    });
  }
}

function serveStatic(req, res, pathname) {
  let requestedPath;
  try {
    requestedPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  } catch {
    sendJson(res, 400, { error: 'Invalid URL path.' });
    return;
  }

  // Do not serve dotfiles, environment files, or this server source.
  if (requestedPath.split('/').some(part => part.startsWith('.')) || requestedPath === '/server.js') {
    sendJson(res, 404, { error: 'Not found.' });
    return;
  }

  const filePath = path.resolve(ROOT, `.${requestedPath}`);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    sendJson(res, 403, { error: 'Forbidden.' });
    return;
  }

  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      sendJson(res, 404, { error: 'File not found.' });
      return;
    }
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin'
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  } catch {
    sendJson(res, 400, { error: 'Invalid request URL.' });
    return;
  }

  if (url.pathname === '/ask') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { error: 'Use POST /ask.' });
      return;
    }
    handleAsk(req, res);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  if (req.method === 'HEAD') {
    // Simple HEAD support using the same resolved path and MIME type.
    const pathName = url.pathname === '/' ? '/index.html' : url.pathname;
    const safePath = path.resolve(ROOT, `.${pathName}`);
    if (!safePath.startsWith(ROOT + path.sep) || pathName.split('/').some(p => p.startsWith('.')) || pathName === '/server.js') {
      res.writeHead(404).end();
      return;
    }
    fs.stat(safePath, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(safePath).toLowerCase()] || 'application/octet-stream', 'Content-Length': stat.size });
      res.end();
    });
    return;
  }
  serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Osmani is running at http://${HOST}:${PORT}`);
  if (!API_KEY) console.warn('CHATTERMATE_API_KEY is not set. The website will load, but /ask will not work.');
});

server.on('error', err => {
  console.error('Server error:', err.message);
  process.exitCode = 1;
});