// Mechanism tests have no external business-call allowance.
import http from 'node:http';
import https from 'node:https';
function local(value) {
  const url = value instanceof URL ? value : new URL(typeof value === 'string' ? value : `${value.protocol ?? 'https:'}//${value.hostname ?? value.host ?? 'invalid'}`);
  if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname)) throw new Error('External network is disabled in mechanism verification');
}
const fetch = globalThis.fetch;
globalThis.fetch = (input,options) => {local(input instanceof Request ? input.url : input);return fetch(input,options);};
for (const client of [http,https]) for (const method of ['get','request']) {
 const original = client[method]; client[method] = function(input,...args) {local(input);return original.call(this,input,...args);};
}
