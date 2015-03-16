var http = require('http');
var https = require('https');


var Server = function(config) {
	var config = config || {};
	if(config.debug === undefined)	{ config.debug = true; }
	if(config.log === undefined)	{ config.log = function(m) { console.log(m); }; }
	this.debug = config.debug;
	this.log = config.log;
};
Server.prototype = {
	debug: null,
	log: null,
	ports: [],
	httpsDefaultCertificate: {
		key: null,
		cert: null,
	},
	events: [],
	add: function(ports, options) {
		if(options === undefined) {
			var options = ports;
			var ports = [options.port];
		} else if(ports instanceof Array === false) {
			var ports = [ports];
		}
		if(options.port === undefined)	{ options.port = 80; }
		if(options.ip === undefined)	{ options.ip = null; }
		if(options.secure === undefined){ options.secure = false; }
		if(options.key === undefined)	{ options.key = null; }
		if(options.cert === undefined)	{ options.cert = null; }
		for(var i in ports) {
			options.port = ports[i];
			this.ports.push(options);
			if(this.debug === true) {
				this.log('Adding port '+(options.ip!==null?options.ip+':':'')+options.port+' '+(options.secure===false?'not ':'')+'secure');
			}
		}
		return this;
	},
	addHttp: function(ports, options) {
		var ports = ports || 80;
		var options = options || {};
		options.secure = false;
		return this.add(ports, options);
	},
	addHttps: function(ports, options) {
		var ports = ports || 443;
		var options = options || {};
		options.secure = true;
		return this.add(ports, options);
	},
	addDefaultCertificate: function(key, cert) {
		this.httpsDefaultCertificate.key = key;
		this.httpsDefaultCertificate.cert = cert;
		return this;
	},
	addEvent: function(callback) {
		this.events.push(callback);
		if(this.debug === true) {
			this.log('Adding event ('+this.events.length+')');
		}
		return this;
	},
	applyEvents: function(req, res, secure) {
		for(var i in this.events) {
			this.events[i](req, res, secure);
		}
		return this;
	},
	listen: function() {
		for(var i in this.ports) {
			var options = this.ports[i];
			var self = this;
			if(options.secure === false) {
				var server = http.createServer(function(req, res) {
					self.applyEvents(req, res, false);
				});
			} else {
				var certificate = {
					key: null,
					cert: null,
				};
				if(options.key !== null) {
					certificate.key = options.key;
				} else if(this.httpsDefaultCertificate.key !== null) {
					certificate.key = this.httpsDefaultCertificate.key;
				}
				if(options.cert !== null) {
					certificate.cert = options.cert;
				} else if(this.httpsDefaultCertificate.cert !== null) {
					certificate.cert = this.httpsDefaultCertificate.cert;
				}
				var server = https.createServer(certificate, function(req, res) {
					self.applyEvents(req, res, true);
				});
			}
			server.listen(options.port, options.ip);
		}
		if(this.debug === true) {
			this.log('Server listens');
		}
		return this;
	},
};


module.exports = Server;
