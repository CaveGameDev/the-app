importScripts('fflate.js');

const CACHE_NAME = 'cl2';
const SCOPE_PREFIX = self.registration.scope;
let decompressedData = null;

const EXACT_PATHS = new Set([
  'assets/assets/hl2.png',
  'assets/icon-192.png',
  'chunks/chunks/background01.data',
  'chunks/background02.data',
  'chunks/background03.data',
  'chunks/background04.data',
  'chunks/background05.data',
  'chunks/background06.data',
  'chunks/bootstrap.data',
  'chunks/d1_canals_01.data',
  'chunks/d1_canals_01a.data',
  'chunks/d1_canals_02.data',
  'chunks/d1_canals_03.data',
  'chunks/d1_canals_05.data',
  'chunks/d1_canals_06.data',
  'chunks/d1_canals_07.data',
  'chunks/d1_canals_08.data',
  'chunks/d1_canals_09.data',
  'chunks/d1_canals_10.data',
  'chunks/d1_canals_11.data',
  'chunks/d1_canals_12.data',
  'chunks/d1_canals_13.data',
  'chunks/d1_eli_01.data',
  'chunks/d1_eli_02.data',
  'chunks/d1_town_01.data',
  'chunks/d1_town_01a.data',
  'chunks/d1_town_02.data',
  'chunks/d1_town_02a.data',
  'chunks/d1_town_03.data',
  'chunks/d1_town_04.data',
  'chunks/d1_town_05.data',
  'chunks/d1_trainstation_01.data',
  'chunks/d1_trainstation_02.data',
  'chunks/d1_trainstation_03.data',
  'chunks/d1_trainstation_04.data',
  'chunks/d1_trainstation_05.data',
  'chunks/d1_trainstation_06.data',
  'chunks/d2_coast_01.data',
  'chunks/d2_coast_03.data',
  'chunks/d2_coast_04.data',
  'chunks/d2_coast_05.data',
  'chunks/d2_coast_07.data',
  'chunks/d2_coast_08.data',
  'chunks/d2_coast_09.data',
  'chunks/d2_coast_10.data',
  'chunks/d2_coast_11.data',
  'chunks/d2_coast_12.data',
  'chunks/d2_prison_01.data',
  'chunks/d2_prison_02.data',
  'chunks/d2_prison_03.data',
  'chunks/d2_prison_04.data',
  'chunks/d2_prison_05.data',
  'chunks/d2_prison_06.data',
  'chunks/d2_prison_07.data',
  'chunks/d2_prison_08.data',
  'chunks/d3_breen_01.data',
  'chunks/d3_c17_01-1.data',
  'chunks/d3_c17_01.data',
  'chunks/d3_c17_02.data',
  'chunks/d3_c17_03.data',
  'chunks/d3_c17_04.data',
  'chunks/d3_c17_05.data',
  'chunks/d3_c17_06a.data',
  'chunks/d3_c17_06b.data',
  'chunks/d3_c17_07.data',
  'chunks/d3_c17_08.data',
  'chunks/d3_c17_09.data',
  'chunks/d3_c17_10a.data',
  'chunks/d3_c17_10b.data',
  'chunks/d3_c17_11.data',
  'chunks/d3_c17_12.data',
  'chunks/d3_citadel_01.data',
  'chunks/d3_citadel_02.data',
  'chunks/d3_citadel_03.data',
  'chunks/d3_citadel_04.data',
  'chunks/d3_citadel_05.data',
  'chunks/manifest.json',
  'dl.html',
  'hl2_launcher.js',
  'hl2_launcher.wasm',
  'index.html',
  'libclient.so',
  'libdatacache.so',
  'libengine.so',
  'libfilesystem_stdio.so',
  'libGameUI.so',
  'libglesv2.so.1',
  'libinputsystem.so',
  'liblauncher.so',
  'libmaterialsystem.so',
  'libscenefilecache.so',
  'libserver.so',
  'libServerBrowser.so',
  'libshaderapidx9.so',
  'libsoundemittersystem.so',
  'libstdshader_dx9.so',
  'libsteam_api.so',
  'libstudiorender.so',
  'libtier0.so',
  'libtogl.so',
  'libvaudio_minimp3.so',
  'libvgui2.so',
  'libvguimatsurface.so',
  'libvideo_services.so',
  'libvphysics.so',
  'libvstdlib.so',
  'libvtex_dll.so',
  'List.txt',
  'SrcWSSM.txt',
  'sw.js'
]);

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith('app-assets-') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function mimeFor(path) {
  const ext = path.split('.').pop().toLowerCase();
  const map = {
    html: 'text/html; charset=utf-8',
    js: 'application/javascript; charset=utf-8',
    mjs: 'application/javascript; charset=utf-8',
    json: 'application/json; charset=utf-8',
    wasm: 'application/wasm',
    data: 'application/octet-stream',
    so: 'application/octet-stream',
    txt: 'text/plain; charset=utf-8',
    css: 'text/css; charset=utf-8',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    mp4: 'video/mp4',
    webm: 'video/webm',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    bin: 'application/octet-stream',
  };
  return map[ext] || 'application/octet-stream';
}

async function loadArchive() {
  if (decompressedData) return decompressedData;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(SCOPE_PREFIX + 'HL2_Web.zip');
    if (!response) return null;
    const buffer = await response.arrayBuffer();
    return new Promise((resolve) => {
      fflate.unzip(new Uint8Array(buffer), (err, data) => {
        if (err) resolve(null);
        else {
          decompressedData = data;
          resolve(data);
        }
      });
    });
  } catch (e) {
    return null;
  }
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (!url.href.startsWith(SCOPE_PREFIX)) {
    return;
  }

  const relativePath = url.href.substring(SCOPE_PREFIX.length);
  if (!EXACT_PATHS.has(relativePath)) {
    return;
  }

  event.respondWith(
    (async () => {
      const data = await loadArchive();
      if (!data) {
        try {
          return await fetch(event.request);
        } catch (err) {
          return new Response('Resource unavailable', { status: 404 });
        }
      }

      const fileBytes = data[relativePath];
      if (!fileBytes) {
        return new Response('Not Found', { status: 404 });
      }

      return new Response(fileBytes, {
        headers: { 
          'Content-Type': mimeFor(relativePath),
          'Content-Length': String(fileBytes.byteLength)
        },
      });
    })()
  );
});