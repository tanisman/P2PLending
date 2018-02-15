"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require("debug");
var express = require("express");
var path = require("path");
var Web3 = require('web3');
var bodyParser = require('body-parser');
var index_1 = require("./routes/index");
var accounts_1 = require("./routes/accounts");
var transactions_1 = require("./routes/transactions");
var wallet_1 = require("./routes/wallet");
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', index_1.default);
app.use('/accounts', accounts_1.default);
app.use('/transactions', transactions_1.default);
app.use('/wallet', wallet_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
app.set('port', process.env.PORT || 3000);
server.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
app.set('socketio', io);
//# sourceMappingURL=app.js.map