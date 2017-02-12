"use strict";

/* eslint-disable no-console, no-magic-numbers */

require("../../index");

var _ = require("lodash");

var slowFunc = function (count) {
  var begin = Date.now();

  var values = _.times(count, function () { return _.random(0, count); });
  values = _.sortBy(values);

  return Date.now() - begin;
};

var bigBuffer = new Buffer(200000000);

var count = 1;
setInterval(function () {
  console.log("Reporting from a test app, %d.", count);
  count++;
}, 1000);

setInterval(function () {
  console.log("[STATUS]  Progress: %d.", count);
}, 2000);

setInterval(function () {
  console.error("[STATUS]  [ERROR] Something wrong!");
}, 5000);

setInterval(function () {
  console.log("Slow call started...");
  var duration = slowFunc(_.random(1000, 100000));
  console.log("Completed in: ", duration);
}, 3000);

setInterval(function () {
  console.log("Filling buffer...");
  bigBuffer.fill(2);
}, 5000);

setInterval(function () {
  console.error("bummer shoulda read the dox :(", new Error().stack);
}, 5000);
