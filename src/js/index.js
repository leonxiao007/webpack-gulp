"use strict";
require('../scss/index.scss');
require('../scss/sprites/mc.scss');
var Url = require('./utils/url.js');
require('zepto');
// es6
//import 'zepto';
//import '../scss/index.scss';
// load image
var logoImg = require('webpackLogo');
var $logo = $('<img />').attr('src', logoImg);
$('#logo').html($logo);
