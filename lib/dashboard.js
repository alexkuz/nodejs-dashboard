"use strict";

var _ = require("lodash");
var blessed = require("blessed");

var StreamView = require("./views/stream-view");
var EventLoopView = require("./views/eventloop-view");
var MemoryView = require("./views/memory-view");
var CpuView = require("./views/cpu-view");
var EventEmitter = require("events");
var StatusbarView = require("./views/statusbar-view");

var Dashboard = function Dashboard(options) {
  this.options = options || {};

  this.screen = blessed.screen({
    smartCSR: true,
    title: options.appName
  });

  this.screen.key(["escape", "q", "C-c"], function () {
    process.exit(0); // eslint-disable-line no-process-exit
  });

  this.statusRegex = options.statusPattern && new RegExp(options.statusPattern);

  this.eventPump = new EventEmitter();
  this._createView();
};

Dashboard.prototype.onEvent = function (event) {
  this.eventPump.emit(event.type, event.data);
  this.screen.render();
};

var stdOutHeight = 0.5;
var stdOutWidth = 0.75;

var metrics = [CpuView, EventLoopView, MemoryView];
var metricsCount = metrics.length;

var stdOutPosition = function (parent, interleave) {
  return {
    left: 0,
    width: Math.ceil(parent.width * stdOutWidth),
    top: 0,
    height: interleave ? parent.height : Math.ceil(parent.height * stdOutHeight)
  };
};

var stdErrPosition = function (parent) {
  return {
    left: 0,
    width: Math.ceil(parent.width * stdOutWidth),
    top: Math.ceil(parent.height * stdOutHeight),
    height: "50%"
  };
};

var metricsPosition = function (index, parent) {
  var top = Math.ceil(index / metricsCount * parent.height);
  var bottom = Math.ceil((index + 1) / metricsCount * parent.height);
  return {
    top: top,
    height: bottom - top,
    left: Math.ceil(parent.width * stdOutWidth),
    width: Math.floor(parent.width * (1 - stdOutWidth))
  };
};

var statusbarPosition = function (parent) {
  return {
    bottom: 0,
    height: 3,
    left: 0,
    width: Math.ceil(parent.width * stdOutWidth)
  };
};

Dashboard.prototype._logStream = function (streamView, statusbarView, data) {
  var lines = data.replace(/\n$/, "").split("\n");
  var statusRegex = this.statusRegex;

  _.each(lines, function (line) {
    if (statusRegex && statusRegex.test(line)) {
      statusbarView.onEvent(line.match(statusRegex)[1]);
    } else {
      streamView.onEvent(line);
    }
  });
};

Dashboard.prototype._createStdoutView = function (container, statusbarView) {
  var stdoutView = new StreamView({
    parent: container,
    scrollback: this.options.scrollback,
    label: this.options.interleave ? "stdout / stderr" : "stdout",
    color: this.options.interleave ? "light-blue" : "green",
    getPosition: stdOutPosition
  });

  this.eventPump.addListener("stdout", this._logStream.bind(this, stdoutView, statusbarView));
};

Dashboard.prototype._createStderrView = function (container, statusbarView) {
  if (!this.options.interleave) {
    var stderrView = new StreamView({
      parent: container,
      scrollback: this.options.scrollback,
      label: "stderr",
      color: "red",
      getPosition: stdErrPosition
    });

    this.eventPump.addListener("stderr", this._logStream.bind(this, stderrView, statusbarView));
  }
};

Dashboard.prototype._createStatusbarView = function (container) {
  if (this.options.statusPattern) {
    return new StatusbarView({
      parent: container,
      getPosition: statusbarPosition
    });
  }

  return null;
};

Dashboard.prototype._createMetricsViews = function (container) {
  _.each(metrics, function (Metric, index) {
    var view = new Metric({
      parent: container,
      getPosition: metricsPosition,
      index: index
    });
    this.eventPump.addListener("metrics", view.onEvent.bind(view));
  }.bind(this));
};

Dashboard.prototype._createView = function () {
  // fixes weird scrolling issue
  var container = blessed.box(this.options.statusPattern ? {
    top: 0,
    bottom: 3
  } : {});

  this.screen.append(container);

  var statusbarView = this._createStatusbarView(this.screen);

  this._createStdoutView(container, statusbarView);
  this._createStderrView(container, statusbarView);

  this._createMetricsViews(this.screen);

  this.screen.render();
};

module.exports = Dashboard;
