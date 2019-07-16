/*
 * Copyright (C) Rihan Pereira <rihen234@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */
/* eslint global-require: 'warn' */

import amqp from 'amqplib';
import config from './helpers/config';
import {parserConsume as consume} from './consumer';
import logger from './helpers/applogging';


async function listenForMessagesFromFetchPublisher() {
	// connect to RabbitMQ Instance
	logger.log('info', 'rabbitmq config %s', JSON.stringify(config.rabbitmq));
	const connection = await amqp.connect(config.rabbitmq);

	logger.log('info', 'authenticated to rabbitmq host %s, vhost %s as user %s',
		config.rabbitmq.hostname,
		config.rabbitmq.vhost,
		config.rabbitmq.username);

	// create consumer channel and prefetch 1 message at a time
	const consumeChannel = await connection.createChannel();
	await consumeChannel.prefetch(1);
	logger.log('info', 'listening with prefetch 1 message at a time');

	// create publisher channel to send work produce to parser consumer via
	// fetch publisher
	const publishChannel = await connection.createConfirmChannel();
	let ansConsume;
	try {
		ansConsume = await consume({connection, consumeChannel, publishChannel});
		logger.log('info', ansConsume);
	}
	catch (except) {
		logger.log('error', 'consume function ', except);
	}
}


listenForMessagesFromFetchPublisher();