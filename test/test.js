var assert = require('assert');

var fs = require('fs');
var http = require('http');
var url = require('url');
var Server = require('../lib/Server.js');


describe('Create server', function() {
	var server = new Server();
	
	describe('Add ports', function() {
		it('Add port 8080 not-secure', function() {
			server.addHttp(8080);
		});
		it('Check port 8080 not-secure', function() {
			assert.equal(server.ports[0].secure, false);
			assert.equal(server.ports[0].port, 8080);
		});
		it('Add port 4433 secure', function() {
			server.addHttps(4433, {
				key: fs.readFileSync(__dirname+'/key.pem'),
				cert: fs.readFileSync(__dirname+'/cert.cer'),
			});
		});
		it('Check port 4433 secure', function() {
			assert.equal(server.ports[1].secure, true);
			assert.equal(server.ports[1].port, 4433);
		});
	});

	describe('Add events', function() {
		var nCall = 0;
		it('Add 3 events', function() {
			server.addEvent(function(req, res) { nCall++; });
			server.addEvent(function(req, res) { nCall++; });
			assert.equal(server.events.length, 2);
			server.addEvent(function(req, res) { nCall++; });
			assert.equal(server.events.length, 3);
		});
		it('Call events', function() {
			server.applyEvents();
			assert.equal(nCall, 3);
			server.applyEvents();
			server.applyEvents();
			assert.equal(nCall, 9);
		});
	});

	describe('Listen ports', function() {
		it('Call method', function() {
			server.listen();
		});
	});

	describe('Test request', function() {
		it('Create event with response', function() {
			server.addEvent(function(req, res) {
				var u = url.parse('http://'+req.headers.host+req.url, true);
				res.end('Random number is '+u.query.random);
			});
		});
		it('Call server and check response', function(done) {
			var random = Math.round(Math.random()*1000000);
			http.request({
				host: 'localhost',
				port: '8080',
				path: '/test/?hello=bonjour&random='+random,
			}, function(res) {
				var data = '';
				res.on('data', function(chunk) {
					data += chunk;
				});
				res.on('end', function() {
					assert.equal(data, 'Random number is '+random);
					done();
				});
			}).end();
		});
	});
});
