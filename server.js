/* ********************************************************************************************************************************************************** *
 * parayer :: server.js                                                                                                                                       *
 * App server-side engine                                                                                                                                     *
 * ********************************************************************************************************************************************************** */

const appVersion = require('./package.json').version;
const express = require('express');
const server = express();
const http = require('http');
const retus = require("retus");
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

	let readyToGo = true;
	
	// Check for: CouchDB server running, and its version
	let couchDbServerUrl = `http://${config.couchDbHost}:${config.couchDbPort}/`;
	try {
		let { body } = retus(couchDbServerUrl, {'method': 'get', 'responseType': 'json'});
		if(body.couchdb==null) {
			log.fatal(`Got a valid response from ${couchDbServerUrl}, but doesn't look like CouchDB's'...`)
			readyToGo = false;
		}
		else if(!body.version.startsWith('3')) {
			log.fatal(`CouchDB version at ${couchDbServerUrl} is ${body.version}; supported version is 3.x.x`);
			readyToGo = false;
		}
	}
	catch(err) {
		log.fatal(`Couldn't connect to CouchDB server at ${couchDbServerUrl}: ${err}`);
		readyToGo = false;
	}
	
	if(readyToGo) {
		// Check for: parayer db available, and its version
		// TODO Improve this: auth data within the URL looks pretty ugly (sp. under plain HTTP)
		let parayerDbUrl = `http://${config.couchDbUser}:${config.couchDbPwd}@${config.couchDbHost}:${config.couchDbPort}/${config.couchDbDb}/`;
 		try { 
			retus(parayerDbUrl, {'method':'get', 'responseType': 'json'});
		}
		catch(err) {
			if(err.statusCode==401)
				log.fatal(`Couldn't connect to parayer database at ${parayerDbUrl}: most likey because of bad auth: ${err}`);
			else if(err.statusCode==404)
				log.fatal(`Couldn't connect to parayer database at ${parayerDbUrl}: most likely because of wrong db name: ${err}`);
			else
				log.fatal(`Couldn't connect to parayer database at ${parayerDbUrl}: ${err}`);
			readyToGo = false;			
		}
		let parayerDBVersionUrl = parayerDbUrl + '_design/core/_view/appVersion';  
		try { 
			retus(parayerDbUrl, {'method':'get', 'responseType': 'json'});
			let { body } = retus(parayerDBVersionUrl, {'method':'get', 'responseType': 'json'});
			if(body.rows[0]==null) {
				log.fatal(`parayer database at ${parayerDbUrl} is unversioned, refusing to accept it`);
				readyToGo = false;
			}
			else if(body.rows[0].value!=appVersion) {
				log.fatal(`parayer database at ${parayerDbUrl} doesn't match app version ${appVersion} (got ${body.rows[0].value})`);
				readyToGo = false;
			}
		}
		catch(err) {
			if(err.statusCode==404)
				log.fatal(`parayer database at ${parayerDbUrl} is unversioned, refusing to accept it`);
			else
				log.fatal(`Couldn't connect to parayer database at ${parayerDbUrl}: ${err}`);
			readyToGo = false;			
		}		
	}
	
	// All done
	if(!readyToGo) {
		setTimeout(() => process.exit(1), 1); // TODO Exit error codes to be defined
		return false;
	}
	else
		return true;
}
/* ********************************************************************************************************************************************************** */
