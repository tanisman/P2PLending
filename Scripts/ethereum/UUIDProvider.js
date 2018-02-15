module.exports = {
    ABI: [{ 'constant': true, 'inputs': [], 'name': 'min_entropy', 'outputs': [{ 'name': '', 'type': 'uint256', 'value': '34' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [], 'name': 'collisionCount', 'outputs': [{ 'name': '', 'type': 'uint256', 'value': '1' }], 'payable': false, 'type': 'function' }, { 'constant': false, 'inputs': [], 'name': 'UUID4', 'outputs': [{ 'name': 'uuid', 'type': 'bytes16' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [], 'name': 'prev', 'outputs': [{ 'name': '', 'type': 'bytes16', 'value': '0x67734a170fd1deba40378005e7993d59' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [], 'name': 'entropy', 'outputs': [{ 'name': '', 'type': 'bytes', 'value': '0x' }], 'payable': false, 'type': 'function' }, { 'constant': false, 'inputs': [], 'name': 'addEntropy', 'outputs': [{ 'name': '', 'type': 'bool' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [], 'name': 'next', 'outputs': [{ 'name': '', 'type': 'bytes16', 'value': '0x67734a170fd1deba40378005e7993d59' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [], 'name': 'getEntropy', 'outputs': [{ 'name': 'key', 'type': 'bytes32', 'value': '0x0000000000000000000000000000000000000000000000000000000000000000' }], 'payable': false, 'type': 'function' }, { 'constant': false, 'inputs': [], 'name': 'getByte', 'outputs': [{ 'name': 'b', 'type': 'bytes1' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [{ 'name': 'v', 'type': 'bytes16' }], 'name': 'setUUID4Bytes', 'outputs': [{ 'name': '', 'type': 'bytes16', 'value': '0x00000000000000004000800000000000' }], 'payable': false, 'type': 'function' }, { 'constant': true, 'inputs': [{ 'name': '', 'type': 'uint256' }], 'name': 'collisions', 'outputs': [{ 'name': '', 'type': 'bytes16', 'value': '0x5b7d7eba22589dfe40d780417faa2a79' }], 'payable': false, 'type': 'function' }, { 'inputs': [], 'payable': false, 'type': 'constructor' }, { 'anonymous': false, 'inputs': [{ 'indexed': false, 'name': 'uuid', 'type': 'bytes16' }], 'name': 'UUID', 'type': 'event' }],
    contractAddress: '0x3ADA1c05C9baCA9815d07ec62b21B895C17FE5FC',
    contract: undefined,
    adminAccount: '0x5A717C02BbaC7b48C19D37373AF2fcBb780EE53B'
};

var Web3 = require('web3');
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    // set the provider you want from Web3.providers
    web3 = new Web3(new Web3.providers.HttpProvider("http://164.132.24.26:8545"));
}

if (typeof module.exports.contract === 'undefined') {
    module.exports.contract = web3.eth.contract(module.exports.ABI).at(module.exports.contractAddress);
}