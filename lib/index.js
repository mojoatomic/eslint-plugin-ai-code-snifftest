/**
 * @fileoverview Does your AI-generated code pass the sniff test? Detect and fix AI code smell.
 * @author mojoatomic
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const requireIndex = require("requireindex");

//------------------------------------------------------------------------------
// Plugin Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    name: "eslint-plugin-ai-code-snifftest",
    version: "0.1.0"
  },
  rules: requireIndex(__dirname + "/rules")
};

