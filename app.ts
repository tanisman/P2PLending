import debug = require('debug');
import express = require('express');
import path = require('path');
var Web3 = require('web3');
var bodyParser = require('body-parser');

import routes from './routes/index';
import accounts from './routes/accounts';
import transactions from './routes/transactions'
import wallet from './routes/wallet';

var app = express();

var server = require('http').Server(app);
var io = require('socket.io')(server);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/', routes);
app.use('/accounts', accounts);
app.use('/transactions', transactions);
app.use('/wallet', wallet);

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
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req, res, next) => {
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
