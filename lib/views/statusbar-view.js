"use strict";

var blessed = require("blessed");

var StatusbarView = function StatusbarView(options) {

  var statusBox = blessed.box({
    label: " status ",
    border: {
      type: "line"
    },
    style: {
      border: {
        fg: "blue"
      }
    },
    position: options.getPosition(options.parent)
  });

  this.statusBox = statusBox;

  options.parent.on("resize", function () {
    statusBox.position = options.getPosition(options.parent);
  });

  options.parent.append(this.statusBox);
};

StatusbarView.prototype.onEvent = function (data) {
  this.statusBox.setContent(data);
};

module.exports = StatusbarView;
