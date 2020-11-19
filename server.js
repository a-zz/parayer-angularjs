/* ********************************************************************************************************************************************************** *
 * parayer :: server.js                                                                                                                                       *
 * App server-side engine                                                                                                                                     *
 * ********************************************************************************************************************************************************** */

// TODO Auth required for frontend access
// TODO User auth service required
// TODO HTTPS support required for frontend <-> express <-> couchdb connections
// TODO Exit error codes to be defined
// TODO Cookie authentication (and re-) for CouchDB

/* *** Server dependencies and configuration *** ************************************************************************************************************ */
const 	__express__	= require('express');	// HTTP server
const 	__http__ 	= require('http');		// HTTP client, asynchronous
const 	__retus__ 	= require("retus");		// HTTP client, synchronous

const 	_appVer_ 	= require('./package.json').version;
var 	_config_ 	= require('./server-config.json');
const 	_log_ 		= require('simple-node-logger').createSimpleLogger(_config_.loggerOpts);

/* *** Start-up procedure *** ******************************************************************************************************************************* */
parseCmdLineArgs();
const 	_server_ 	= initServer();

/* *** Service definitions *** ****************************************************************************************************************************** */
/* Static contents (i.e. angular-js frontend files) served from app/ subdir */
_server_.use(__express__.static('app'));

/* User authentication service */
// TODO User auth to be implemented
_server_.get('/_usrauth', function(req, res) {
	
	_log_.info('User authentication request ' + req.url + ': to be implemented!');
    res.send('User authentication request ' + req.url + ': to be implemented!');
});

/* Data requests (to be redirected to CouchDB server) */
const dbRequestPrefix = '/_data';
_server_.get(dbRequestPrefix + '/*', function(req, res) {
	
	let couchdbQueryString = req.url.substring(dbRequestPrefix.length); 
	let httpOptions = {
    	host: _config_.couchDbHost,
    	port: _config_.couchDbPort,
    	path: '/' + _config_.couchDbDb + couchdbQueryString,
    	method: 'GET',
		headers: {
			'authorization': _config_.couchDbAuthHeader
		}
  	};
	let httpReq = __http__.request(httpOptions, function(httpResp) {
		
		let httpRespData = '';
    	httpResp.setEncoding('utf8');
		httpResp.on('data', function(chunk) {
			httpRespData += chunk;
		});
	    httpResp.on('end', function() {
			// TODO Parse httpRespData for error messages, log accordingly
      		_log_.debug(_log_.info(`db GET request to ${couchdbQueryString}`));
			_log_.trace('db returned '+ httpRespData);
    		res.send(httpRespData);
    	})
  	}).on("error", function(err) {
  		_log_.error(`db GET request ${couchdbQueryString}: ${err.message}`);
	});
    httpReq.end();
});

_server_.put(dbRequestPrefix + '/*', function(req, res) {
	
	let putData = JSON.stringify(req.body).replace(/[^\0-~]/g, function(ch) {
        return "\\u" + ("000" + ch.charCodeAt().toString(16)).slice(-4);
    });
	
	let couchdbQueryString = req.url.substring(dbRequestPrefix.length);
	let httpOptions = {
    	host: _config_.couchDbHost,
    	port: _config_.couchDbPort,
    	path: '/' + _config_.couchDbDb + couchdbQueryString,
    	method: 'PUT',
		headers: {
			'authorization': _config_.couchDbAuthHeader,
			'Content-Type': 'application/json; charset=utf-8',
    		'Content-Length': putData.length
		}
  	};
	let httpReq = __http__.request(httpOptions, function(httpResp) {
		
		let httpRespData = '';
    	httpResp.setEncoding('utf8');
		httpResp.on('data', function(chunk) {
			httpRespData += chunk;
		});
	    httpResp.on('end', function() {
			// TODO Parse httpRespData for error messages, log accordingly
      		_log_.debug(`db PUT request to ${couchdbQueryString} : (data: ${putData})`);
			_log_.trace('db returned '+ httpRespData);
    		res.send(httpRespData);
    	})
  	}).on("error", function(err) {
  		_log_.error('db PUT request ' + couchdbQueryString + ': ' + err.message);
	});
	httpReq.write(putData);
    httpReq.end();
});

/* Test service */ 
_server_.get('/_test', function(req, res) {
	
    res.send({'message': 'It works! :)', 'version': _appVer_ });
});

/* *** Initialization procedure *** ************************************************************************************************************************* */
function initServer() {

	_log_.info(welcomeMsg());
	_log_.debug('Starting pre-flight check...');
	
	var readyToGo = true;
	readyToGo = readyToGo && initDbConnection();
		
	if(readyToGo) {
		let server = __express__();
		_log_.debug('Everything seems fine, ready to go!');
		server.listen(_config_.httpPort, function() {
	
			_log_.info(`Server up & runnig, listening on port: ${_config_.httpPort} \\o/`);
		});
		server.use(__express__.json());
		return server;
	}		
}

function welcomeMsg() {
	
	return 	'\n ' +
			'   ____  ____ __________ ___  _____  _____\n' +
			'   / __ \\/ __ `/ ___/ __ `/ / / / _ \\/ ___/\n' +
			'  / /_/ / /_/ / /  / /_/ / /_/ /  __/ /    \n' +
			' / .___/\\__,_/_/   \\__,_/\\__, /\\___/_/     \n' + 
			'/_/                     /____/ version ' + _appVer_ + ' booting...\n';
}

function initDbConnection() {

	let readyToGo = true;
		
	_config_.couchDbServerUrl = `http://${_config_.couchDbHost}:${_config_.couchDbPort}`;
	_config_.parayerDbUrl = `${_config_.couchDbServerUrl}/${_config_.couchDbDb}`;
	_config_.couchDbAuthHeader = 'Basic ' + Buffer.from(_config_.couchDbUser + ':' + _config_.couchDbPwd).toString('base64');
		
	if(_config_.couchDbByPassInitCheck) {
		_log_.debug('Bypassing init db check as ordered (--bypass-init-db-check)');
		return true;
	}
		
	if(readyToGo) { // Check for: CouchDB server running, and its version		
		try {
			let { body } = __retus__(_config_.couchDbServerUrl, {'method': 'get', 'responseType': 'json'});
			_log_.trace(`CouchDB query ${_config_.couchDbServerUrl} returned: ` + JSON.stringify(body));
			if(body.couchdb==null) {
				_log_.fatal(`Got a valid response from ${_config_.couchDbServerUrl}, but doesn't look like CouchDB's'...`)
				readyToGo = false;
			}
			else if(!body.version.startsWith('3')) {
				_log_.fatal(`CouchDB version at ${_config_.couchDbServerUrl} is ${body.version}; supported version is 3.x.x`);
				readyToGo = false;
			}
			else
				_log_.debug(`Checked CouchDb server and its version: OK`);
		}
		catch(err) {
			_log_.fatal(`Couldn't connect to CouchDB server at ${_config_.couchDbServerUrl}: ${err}`);
			readyToGo = false;
		}		
	}
	
	if(readyToGo) { // Check for: parayer db available		
 		try { 
			__retus__(_config_.parayerDbUrl, {
				'method':'get', 
				'responseType': 'json', 
				headers: {
					'authorization': _config_.couchDbAuthHeader
				}
			});
			_log_.debug(`Checked whether parayer db is available: OK`);
		}
		catch(err) {
			switch(err.statusCode) {
			case 401:
				_log_.fatal(`Couldn't connect to parayer db at ${_config_.parayerDbUrl}: ` +
						`most likey because of bad auth (${_config_.couchDbAuthHeader}): ${err}`);
				break;
			case 404:
				_log_.fatal(`Couldn't connect to parayer db at ${_config_.parayerDbUrl}: ` +
						`most likely because of wrong db name: ${err}`);
				break;
			default:
				_log_.fatal(`Couldn't connect to parayer db at ${_config_.parayerDbUrl}: ${err}`);
			}
			readyToGo = false;			
		}		
	}
	
	if(readyToGo) { // Check for: parayer db version		
		var parayerDBVersionUrl = _config_.parayerDbUrl + '/_design/core/_view/appVersion';  
		try { 
			let { body } = __retus__(parayerDBVersionUrl, {
				'method':'get', 
				'responseType': 'json',
				headers: {
					'authorization': _config_.couchDbAuthHeader
				}
			});
			_log_.trace(`CouchDB query ${parayerDBVersionUrl} returned: ` + JSON.stringify(body));
			if(body.rows[0]==null) {
				_log_.fatal(`parayer db at ${_config_.parayerDbUrl} is unversioned, refusing to accept it`);
				readyToGo = false;
			}
			else if(body.rows[0].value!=_appVer_) {
				_log_.fatal(`parayer db at ${_config_.parayerDbUrl} doesn't match app version ${_appVer_} (got ${body.rows[0].value})`);
				readyToGo = false;
			}
			else
				_log_.debug(`Checked for matching parayer db version: OK (${_config_.parayerDbUrl}, authorization header: ${_config_.couchDbAuthHeader})`);
		}
		catch(err) {
			switch(err.statusCode) {
			case 404:
				_log_.fatal(`parayer db at ${_config_.parayerDbUrl} is unversioned, refusing to accept it`);
				break;
			default:
				_log_.fatal(`Couldn't connect to parayer db at ${_config_.parayerDbUrl}: ${err}`);
			}
			readyToGo = false;			
		}				
	}
	
	// All done
	if(!readyToGo) {
		setTimeout(() => process.exit(11), 1); // TODO Exit error codes to be defined
		return false;
	}
	else
		return true;
}
/* *** Utilities *** **************************************************************************************************************************************** */
function parseCmdLineArgs() {
	
	var inTrouble = false;
	for(let i = 2; i<process.argv.length; i++) {
		if(process.argv[i]=='--bypass-init-db-check')
			_config_.couchDbByPassInitCheck = true;
		else
			inTrouble = true;
	}
	if(inTrouble) {
		console.log(`parayer server-side engine, version ${_appVer_}`);
		console.log(`Bailing out because of wrong startup parameters.\n`);
		console.log(`Valid arguments are:`);
		console.log(`  --bypass-init-db-check	For faster boots, e.g. in development enviroments`);
		console.log(`\n`);
		process.exit(1); // TODO Exit error codes to be defined
	}
}
/* ********************************************************************************************************************************************************** */
