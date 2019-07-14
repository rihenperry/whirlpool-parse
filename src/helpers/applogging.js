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


const {createLogger, config, format, transports} = require('winston');


const {combine, splat, timestamp, colorize, simple} = format;

const DailyRotateFile = require('winston-daily-rotate-file');


const filename = 'whirlpool-parse-%DATE%.log';

const logger = createLogger({
	levels: config.syslog.levels,
	format: combine(
		splat(),
		timestamp(),
		colorize(),
		simple()
	),
	transports: [
		new transports.Console(),
		new DailyRotateFile({
			name: filename,
			datePattern: 'YYYY-MM-DD-HH',
			filename: path.join(__dirname, '../logs', filename)
		})
	],
	exitOnError: false
});

logger.log('info', 'winston logging configured and effective');

export default logger;
