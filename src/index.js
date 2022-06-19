import {
  Router,
  listen
} from 'worktop';

const API = new Router();
const VERSION = '0.0.1';


API.add('GET', '/update', async (request, res) => {
  //determ default ip address
  let ip = request.query.get('ip');
  let ipv6 = request.query.get('ipv6');
  if (ip === null || ip === '') {
    ip = request.headers.get("cf-connecting-ip");
  }
  request.query.set('ip', ip)

  //remove unnecessary headers
  let newHeaders = new Headers();
  for (v of request.headers) {
    ["host", 'cf-connecting-ip'].indexOf(v[0]) == -1 && newHeaders.append(v[0], v[1]);
  }
  request.headers = newHeaders
  newHeaders.set('user-agent', request.headers.get('user-agent') + " Cf-duckdns-broker/" + VERSION);

  //reset hostname
  request.hostname = "www.duckdns.org";
  newHeaders.set('host', request.hostname)
  let urlString = request.url.replace(new RegExp("http(s?)://.*?/", "i"), `https://${request.hostname}/`);

  if (request.method === "GET" || request.method === "HEAD") {
    request.body = null
  }

  const newRequest = new Request(urlString, request);

  let response = await fetch(newRequest);

  //useing stream API
  let {
    readable,
    writable
  } = new TransformStream();
  response.body.pipeTo(writable);
  return new Response(readable, response);
});

API.add('GET', '/_/debug', (request, res) => {
  res.end(JSON.stringify([request, res]));
});

API.add('GET', '/', (request, res) => {
  return new Response(request.headers.get("cf-connecting-ip"), {
    status: 200
  })
});

listen(API.run);