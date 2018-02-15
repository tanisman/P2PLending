"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var Web3 = require('web3');
var pug = require('pug');
var store = require('store');
var akt = require('../Scripts/ethereum/AkbankToken');
var router = express.Router();
var io = undefined;
router.post('/', function (req, res) {
    if (io == undefined) {
        io = req.app.get('socketio');
    }
    var newAddress = web3.personal.newAccount(req.body.accpwd);
    var html = pug.compile("tr\n            td #{ address }\n            td #{ balance }")({ address: newAddress, balance: 0 });
    var accounts = store.get('accountList');
    accounts.push({ address: newAddress, balance: 0 });
    store.set('accountList', accounts);
    res.render('accounts', { accountList: accounts });
});
router.get('/', function (req, res) {
    if (io == undefined) {
        io = req.app.get('socketio');
    }
    var accounts = store.get('accountList');
    if (accounts == undefined) {
        accounts = [];
        store.set('accountList', []);
    }
    //var aa = akt.contract.getBalance.call('0x5A717C02BbaC7b48C19D37373AF2fcBb780EE53B');
    //console.log(aa.toNumber());
    if (accounts.length == 0) {
        accounts.push({ address: '0x5A717C02BbaC7b48C19D37373AF2fcBb780EE53B', balance: 0 });
        accounts.push({ address: '0x8D458F63a7775B6e4a5ee331BBD8A84d700Aa6Da', balance: 0 });
    }
    for (var x = 0; x < accounts.length; x++) {
        accounts[x].balance = akt.contract.getBalance.call(accounts[x].address).toNumber() / 10e5;
    }
    res.render('accounts', { accountList: accounts });
});
exports.default = router;
//# sourceMappingURL=accounts.js.map