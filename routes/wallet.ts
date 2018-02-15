import express = require('express');
var Web3 = require('web3');
var pug = require('pug');
var store = require('store');
var akt = require('../Scripts/ethereum/AkbankToken');


const router = express.Router();
var io = undefined;
declare var web3: any;

var LendingAdded = akt.contract.LendingAdded({}, { fromBlock: 0, toBlock: 'latest' });
LendingAdded.watch(function (error, eventResult) {
    if (!error) {
        console.log(JSON.stringify(eventResult.args));
    } else {
        console.log(error);
    }
});

var MoneyBorrowed = akt.contract.MoneyBorrowed({}, { fromBlock: 'latest', toBlock: 'latest' });
MoneyBorrowed.watch(function (error, eventResult) {
    if (!error) {
        web3.personal.unlockAccount(akt.adminAccount, '1qwexdqwexd!');
        var estimate = akt.contract.updateDebt.estimateGas(eventResult.args.lendingId, 1, Date.now())
        akt.contract.updateDebt(eventResult.args.lendingId, 1, Date.now(), {
            from: akt.adminAccount, to: akt.contractAddress, value: '0x0', gas: estimate, gasPrice: '0x12a05f200'
        });
        console.log(JSON.stringify(eventResult.args));
    } else {
        console.log(error);
    }
});


router.post('/:accountid/:type', (req: express.Request, res: express.Response) => {
    if (io == undefined) {
        io = req.app.get('socketio');
    }
    if (req.params.type === 'lend') {
        var amount = req.body.amount;
        var months = req.body.months;
        var rate = req.body.rate;
        var pwd = req.body.pwd;

        try {
            web3.personal.unlockAccount(req.params.accountid, pwd, 1);
            
            web3.eth.defaultAccount = akt.adminAccount;
            web3.personal.unlockAccount(web3.eth.defaultAccount, '1qwexdqwexd!');

            var estimate = akt.contract.lendMoney.estimateGas(req.params.accountid, amount, rate, months, Date.now());
            akt.contract.lendMoney(req.params.accountid, amount, rate, months, Date.now(), {
                from: akt.adminAccount, to: akt.contractAddress, value: '0x0', gas: estimate, gasPrice: '0x12a05f200'
            });
            res.send('lend added successfuly');
        }
        catch (err) {
            res.send('cannot add lending!');
            console.log(err);
            return;
        }
    }
    else if (req.params.type === 'borrow') {
        try {
            var lendId = req.body.lendId;
            var pwd = req.body.pwd;
            web3.eth.defaultAccount = req.params.accountid;
            web3.personal.unlockAccount(web3.eth.defaultAccount, pwd);
            var estimate = akt.contract.borrowMoney.estimateGas(lendId);
            akt.contract.borrowMoney(lendId, {
                from: req.params.accountid, to: akt.contractAddress, value: '0x0', gas: estimate, gasPrice: '0x12a05f200'
            });
            res.send('borrowed money successfuly')
        }
        catch (err) {
            res.send('cannot borrow lending!');
            console.log(err);
            return;
        }
    }
});

router.get('/:accountid', (req: express.Request, res: express.Response) => {
    if (io == undefined) {
        io = req.app.get('socketio');
    }

    var lendings = [];
    var lendingIds = akt.contract.getLendingsOf.call(req.params.accountid);
    for (var x = 0; x < lendingIds.length; x++) {
        var data = akt.contract.getLending(lendingIds[x]);
        var stateStr = 'UNKNOWN';
        if (data[1] == 0) {
            stateStr = 'AVAILABLE';
        }
        else if (data[1] == 1) {
            stateStr = 'LENDED';
        }
        else if (data[1] == 2) {
            stateStr = 'EXPIRED';
        }

        var debtorId = 0x0;
        var dateLeft = 0x0;
        if (data[6] != 0x0) {
            var debt = akt.contract.getDebt.call(data[6]);
            debtorId = debt[0];
            var now = new Date(Date.now());
            var borrowDate = new Date(debt[3] * 1);
            borrowDate.setMonth(borrowDate.getMonth() + data[4] * 1);
            var timeDiff = borrowDate.getTime() - now.getTime();
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            stateStr += '(' + diffDays + ' DAYS LEFT)';
        }
        lendings.push({ ID: lendingIds[x], amount: data[2], rate: data[3], months: data[4], lendDate: data[5], debtor: debtorId, state: stateStr });
    }

    var debts = [];
    var debtIds = akt.contract.getDebtsOf.call(req.params.accountid);
    for (var x = 0; x < debtIds.length; x++) {
        var data = akt.contract.getDebt(debtIds[x]);
        var stateStr = 'UNKNOWN';
        if (data[2] == 0) {
            stateStr = 'AVAILABLE';
        }
        else if (data[2] == 1) {
            stateStr = 'IN PROGRESS';
        }
        else if (data[2] == 2) {
            stateStr = 'EXPIRED';
        }

        var lending = akt.contract.getLending.call(data[1]);
        var _date_borrow = new Date(data[3] * 1);
        var _date_expiry = new Date(data[3] * 1);
        _date_expiry.setMonth(_date_borrow.getMonth() + lending[4] * 1);

        if (data[2] == 1) {
            var now = new Date(Date.now());
            var timeDiff = _date_expiry.getTime() - now.getTime();
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            stateStr += '(' + diffDays + ' DAYS LEFT)';
        }
        debts.push({ ID: debtIds[x], lender: lending[0], borrowDate: _date_borrow, expiryDate: _date_expiry, amount: lending[2] * (1 + lending[3] * 0.01 * 0.083333) ** lending[4], state: stateStr });
    }

    var _allLendings = [];
    for (var x = 0; x < web3.eth.accounts.length; x++) {
        var ids = akt.contract.getLendingsOf.call(web3.eth.accounts[x]);
        for (var y = 0; y < ids.length; y++) {
            var data = akt.contract.getLending.call(ids[y]);
            if (data[1] == 0) {
                _allLendings.push({ ID: ids[y], amount: data[2], rate: data[3], months: data[4], lendDate: data[5] });
            }
        }
    }
    res.render('wallet', { address: req.params.accountid, lendingList: lendings, debtList: debts, allLendings: _allLendings });
});

export default router;