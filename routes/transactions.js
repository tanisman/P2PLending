"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var Web3 = require('web3');
var akt = require('../Scripts/ethereum/AkbankToken');
var uuid = require('../Scripts/ethereum/UUIDProvider');
var pug = require('pug');
var store = require('store');
var io = undefined;
var router = express.Router();
var Transfer = akt.contract.Transfer({}, { fromBlock: 0, toBlock: 'latest' });
Transfer.watch(function (error, eventResult) {
    if (!error) {
        var transactions = store.get('transactionList');
        if (transactions == undefined) {
            transactions = [];
            store.set('transactionList', []);
        }
        transactions.push(eventResult.args);
        console.log(eventResult.args);
        store.set('transactionList', transactions);
        if (io !== undefined) {
            var html = pug.compile("tr\n            td #{ from }\n            td #{ to }\n            td #{ value }")(eventResult.args);
            io.sockets.emit('update transaction', html);
        }
    }
    else {
        console.log(error);
    }
});
router.get('/', function (req, res) {
    if (io == undefined) {
        io = req.app.get('socketio');
    }
    var transactions = store.get('transactionList');
    if (transactions == undefined) {
        transactions = [];
        store.set('transactionList', []);
    }
    res.render('transactions', { transactionList: transactions });
});
exports.default = router;
//# sourceMappingURL=transactions.js.map