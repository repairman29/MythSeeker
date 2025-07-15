"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.default = admin;
//# sourceMappingURL=init.js.map