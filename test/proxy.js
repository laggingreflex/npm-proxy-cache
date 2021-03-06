'use strict';
const assert = require('assert');
const http = require('http');
const request = require('request');


describe('proxy', function() {

  const MOCK_PORT = 5000;
  const PROXY_PORT = 32403;
  const calledMock = {};
  let proxy;

  const server = http.createServer(function(req, res) {
    calledMock[req.method + req.url] = calledMock[req.method + req.url] + 1 || 1;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ random: Math.random() }));
  });

  before(function(done) {
    server.listen(MOCK_PORT, function(err) {
      if (err) return done(err);

      proxy = require('../lib/proxy').powerup({
        port: PROXY_PORT,
        metadataExcluded: true,
        ttl: 1800
      });
      done();
    });
  });

  after(function() {
    proxy.httpServer.close();
    proxy.httpsServer.close();
    server.close();
  });

  function performNpmRequest(fn) {
    request({
      baseUrl: 'http://127.0.0.1:' + PROXY_PORT,
      uri: '/test',
      headers: {
        accept: 'application/json',
        host: '127.0.0.1:' + MOCK_PORT
      }
    }, fn);
  }

  it('should not cache metadata requests', function(done) {
    performNpmRequest(function(err, res, resBody) {
      if (err) return done(err);

      const originalBody = resBody;

      performNpmRequest(function(err, res, resBody) {
        if (err) return done(err);
        assert.notDeepEqual(resBody, originalBody);
        assert.equal(calledMock['GET/test'], 2, 'Mock is not called twice');
        done();
      });
    });
  });
});
