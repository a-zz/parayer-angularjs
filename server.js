/* ********************************************************************************************************************************************************** *
 * parayer :: server.js                                                                                                                                       *
 * App server-side engine                                                                                                                                     *
 * ********************************************************************************************************************************************************** */

const appVersion = require('./package.json').version;
const express = require('express');
const server = express();
const http = require('http');
const config = require('./server-config.json');
const log = require('simple-node-logger').createSimpleLogger(config.loggerOpts);
log.info(welcomeMsg());
var readyToGo = true;
readyToGo = readyToGo && checkDb();
if(readyToGo) {
	server.listen(config.httpPort, function() {

		log.info(`Server up & runnig, listening on port: ${config.httpPort}`);
	});
}

/* *** Service definitions *** ****************************************************************************************************************************** */
/* Static contents (i.e. angular-js frontend files) served from app/ subdir */
server.use(express.static('app'));

/* User authentication service */
// TODO User auth to be implemented
server.get('/_usrauth', function(req, res) {
	
	log.info('User authentication request ' + req.url + ': to be implemented!');
    res.send('User authentication request ' + req.url + ': to be implemented!');
});

/* Data requests (to be redirected to CouchDB server) */
const backendRequestPrefix = '/_data';
server.get(backendRequestPrefix + '/*', function(req, res) {
	
	let couchdbQueryString = req.url.substring(backendRequestPrefix.length); 
	let httpOptions = {
    	host: config.couchDbHost,
    	port: config.couchDbPort,
    	path: config.couchDbDb + couchdbQueryString,
    	method: 'GET'
  	};
	let httpReq = http.request(httpOptions, function(httpResp) {
		
		let httpRespData = '';
    	httpResp.setEncoding('utf8');
		httpResp.on('data', function(chunk) {
			httpRespData += chunk;
		});
	    httpResp.on('end', function() {
			// TODO Parse httpRespData for error messages, log accordingly
      		log.info('CouchDB GET request ' + couchdbQueryString + ': ' + httpRespData);
    		res.send(httpRespData);
    	})
  	}).on("error", function(err) {
  		log.error('CouchDB GET request ' + couchdbQueryString + ': ' + err.message);
	});
    httpReq.end();
});

/* Test service */ 
server.get('/_test', function(req, res) {
	
    res.send({'message': 'It works! :)', 'version': appVersion });
});
/* *** Utility functions *** ******************************************************************************************************************************** */
function welcomeMsg() {
	
	return 	'\n ' +
			'   ____  ____ __________ ___  _____  _____\n' +
			'   / __ \\/ __ `/ ___/ __ `/ / / / _ \\/ ___/\n' +
			'  / /_/ / /_/ / /  / /_/ / /_/ /  __/ /    \n' +
			' / .___/\\__,_/_/   \\__,_/\\__, /\\___/_/     \n' + 
			'/_/                     /____/ version ' + appVersion + ' booting up!\n';
}

function checkDb() {
	
	// TODO Check for: CouchDb server running
	// TODO Check for: CouchDb server version
	// TODO Check for: parayer db available
	// TODO Check for: parayer db matching app version
	log.fatal('CouchDb server not tested yet, bailing out');
	setTimeout(() => process.exit(1), 1); // TODO Exit error codes to be defined
	return false;
}
/* ********************************************************************************************************************************************************** */
