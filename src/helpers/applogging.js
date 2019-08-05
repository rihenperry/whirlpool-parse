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

import path from 'path';
import winston from 'winston';

const {format} = require('winston');
const PROJECT_ROOT = path.join(__dirname, '..');
const LOG_DIR = path.join(PROJECT_ROOT, '..')

const options = {
  file: {
    level: 'error',
    filename: `${LOG_DIR}/logs/rotating.log`,
    handleExceptions: true,
    json: false,
    maxsize: 5242880, // 5MB
    maxFiles: 10,
    colorize: false,
    timestamp: true
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    colorize: true,
    timestamp: true
  }
};

const customFormat = format.printf(({ level, message, label, timestamp }) => {
  return `${timestamp} - [${level}]: ${message} - (${label})`;
});

const getCustomLabel = (callingModule) => {
  var parts = callingModule.filename.split('/');
  return parts[parts.length - 2] + '/' + parts.pop();
};

const log = function(callingModule) {
  return winston.createLogger({
    format: format.combine(
      format.colorize(),
      format.splat(),
      format.simple(),
      format.label({ label: getCustomLabel(callingModule) }),
      format.timestamp(),
      customFormat
    ),
    transports: [
      new winston.transports.File(options.file),
      new winston.transports.Console(options.console)
    ],
    exitOnError: false
  });
};

const mylog = log(module);
mylog.debug("PROJECT ROOT=%s", PROJECT_ROOT);
mylog.debug("LOG_DIR=%s", LOG_DIR);
mylog.info('winston logging configured and effective');

export default log;
