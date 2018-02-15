import express = require('express');
var Web3 = require('web3');
var pug = require('pug');
var store = require('store');
var akt = require('../Scripts/ethereum/AkbankToken');

const router = express.Router();
var io = undefined;
declare var web3: any;


router.post('/', (req: express.Request, res: express.Response) => {
    if (io == undefined) {
        io = req.app.get('socketio');
    }
    var newAddress = web3.personal.newAccount(req.body.accpwd);
    var html = pug.compile(`tr
            td #{ address }
            td #{ balance }`)({ address: newAddress, balance: 0 });

    var accounts = store.get('accountList');
    accounts.push({ address: newAddress, balance: 0 });
    store.set('accountList', accounts);
    res.render('accounts', { accountList: accounts });
});

router.get('/', (req: express.Request, res: express.Response) => {
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

export default router;