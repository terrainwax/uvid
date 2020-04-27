'use strict';

const Hapi = require('@hapi/hapi');
const Path = require('path');

const init = async () => {

    const server = Hapi.server({
        port: 80,
        host: 'localhost'
		routes: {
            files: {
                relativeTo: Path.join(__dirname, '../client/build')
            }
        }
    });


	server.route({
    method: 'GET',
    path: '/api',
    handler: function (request, h) {

        return 'Hello World!';
    }
	});

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();