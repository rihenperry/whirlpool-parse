/*
 * Copyright (C) 2015-2017  Rihan Pereira
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

import {readFileSync} from 'fs';
const mongoose = require('mongoose');
const amqp = require('amqplib');

// app level imports
import logger from './applogging.js';

/* read configuration file for this application. */
const baseConfigFilename = 'config';
const configContents = readFileSync(`config/${baseConfigFilename}.json`);
const config = JSON.parse(configContents);

const log = logger(module);

const authMongoDB = async function() {
  let connstr = null;

  if (process.env.NODE_ENV === 'production') {
    connstr = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PWD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.DB}`;
  } else {
    let options = config.nosql;
    connstr = `mongodb://${options.username}:${options.password}@${options.hostname}:${options.port}/${options.dbname}`;
  }

  try {
    await mongoose.connect(connstr, { useNewUrlParser: true });
  } catch (error) {
    log.error('cannot connect to mongoose %', error);
    log.warn('cannot connect to mongoose %', error);
  }
};

mongoose.connection.on('connecting', () => {
  log.debug('connecting to %s mongodb', process.env.NODE_ENV);
});

mongoose.connection.on('connected', () => {
  log.info('connected to %s mongodb', process.env.NODE_ENV);
});

mongoose.connection.on('disconnected', function(){
  log.warn("%s mongodb disconnected", process.env.NODE_ENV);
});

process.on('SIGINT', function () {
  mongoose.connection.close(function() {
    log.warn("%s mongodb default connection is disconnected due to application termination",
             process.env.NODE_ENV);
    process.exit(0);
  });
});

//register db models
import '../models/whirlpoolpages.js';

const authRMQ = async () => {
  let connection = null;

  try {
    log.debug('rabbitmq config %s', JSON.stringify(config.rabbitmq));
    connection = await amqp.connect(config.rabbitmq);

    log.info('authenticated to rabbitmq host %s, vhost %s as user %s',
             config.rabbitmq.hostname,
             config.rabbitmq.vhost,
             config.rabbitmq.username);
  } catch(e) {
    log.error('rabbitmq conn broken %s', e);
  }

  return connection;
};

export {authMongoDB, authRMQ};
