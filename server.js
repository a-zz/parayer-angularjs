/* ********************************************************************************************************************************************************** *
 * parayer :: server.js                                                                                                                                       *
 * App server-side engine                                                                                                                                     *
 * ********************************************************************************************************************************************************** */
const express = require('express');
const server = express();
const PORT = 3000;

/* Static contents (i.e. angular-js frontend files) served from app/ subdir */
server.use(express.static('app'));

/* User authentication service */
server.get('/_usrauth', (req, res) => {
	console.log('User authentication request ' + req.url + ': to be implemented!');
    res.send('User authentication request ' + req.url + ': to be implemented!');
});

/* Backend request (to be redirected to CouchDB server) */
server.get('/_backend/*', (req, res) => {
	console.log('Backend request ' + req.url + ': to be implemented!');
    res.send('Backend request ' + req.url + ': to be implemented!');
});

/* Test URL */ 
server.get('/_test', (req, res) => {
    res.send('Hello World! (i.e. up & running! :)');
});

/* Server startup */
server.listen(PORT, () => {
	console.log(`Server listening on port: ${PORT}`)
});
/* ********************************************************************************************************************************************************** */