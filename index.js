const http = require('http');
const fs = require('fs');

const port = process.env.PORT || 3000;
const base = './public';

function handler(req, res) {
	let data = '';
	req.on('data', chunk => data += chunk);
	
	switch (req.method) {
		case 'GET':
			checkFile(base + req.url)
				.then(filename => {
					res.writeHead(200, 'OK', {'Content-Type': 'text/html'});
					fs.createReadStream(filename).pipe(res);
				})
				.catch(err => {
					res.writeHead(404, http.STATUS_CODES[404], {'Content-Type': 'text/plain'});
					res.end('File not found');
				});
			break;
		case 'POST':
			req.on('end', () => {
				res.writeHead(200, 'OK', {'Content-Type': 'application/json'});
				createResponse(data, req.headers['content-type'], req.headers.firstname)
					.then(data => res.write(data))
					.then(data => res.end())
					.catch(err => res.end(err));
				console.log('response');
			});
			break;
		default:
			res.writeHead(404, http.STATUS_CODES[404], {'Content-Type': 'text/plain'});
			res.end('File not found');
	}
}

function createResponse(data, type, firstname) {
	let result = '';
	switch (type) {
		case 'application/json':
			data = JSON.parse(data);
			break;
		case 'application/x-www-form-urlencoded':
			const querystring = require('querystring');
			data = querystring.parse(data);
			break;
	}
	
	lastname = JSON.stringify({'lastName': data.lastname});
	
	return new Promise((resolve, reject) => {
		
		let options = {
				host: 'netology.tomilomark.ru',
				json: true,
				port: 80,
				method:	"POST",
				path: '/api/v1/hash',
				headers:{
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(lastname),
					'firstname': firstname
				}
		};
		
		let request = http.request(options);
		
		request.on('response', response => {
			let data = '';
			response.on('data', (chunk) => {
				data += chunk;
			});
			response.on('end', () => {
				console.log(data);
				resolve(JSON.stringify(data));
			});
			response.on('error', err => {
				console.error(`problem with request: ${err.message}`);
				reject(err.message);
			});
		});
		request.write(lastname);
		request.end();
	});
}

const server = http.createServer();
server.on('error', err => console.error(err));
server.on('request', handler);
server.on('listening', () => {
	console.log('Start HTTP on port %d', port);
});
server.listen(port);

function checkFile(filename) {
	return new Promise((resolve, reject) => {
		fs.stat(filename, (err, stat) => {
			if (err) return reject(err);
			if (stat.isDirectory()) {
				return resolve(checkFile(filename + 'index.html'));
			}
			if (!stat.isFile()) return reject('Not a file');
			fs.access(filename, fs.R_OK, err => {
				if (err) reject(err);
				resolve(filename);
			});
		});
	});
}