const {mongoose, Schema, model} = require('mongoose');
import authMongoDB from '../helpers/config.js';

const whirlpoolPageSchema = new Schema({
  domain: String,
  url: String,
  type: String,
  html: String,
  ts: {type: Date, default: Date.now}
});


export let WhirlpoolPage = model('whirlpoolpage', whirlpoolPageSchema, 'whirlpoolPages');
