pragma solidity ^0.4.13;
contract UUIDProvider {
    function UUID4() returns (bytes16 uuid);
}

contract owned {
    address public owner;
    function owned() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require (msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner {
        owner = newOwner;
    }
}

contract tokenRecipient { function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData); }

contract token {
    /* Public variables of the token */
    string public standard = 'AKT 0.1b';
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    /* This creates an array with all balances */
    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    /* This generates a public event on the blockchain that will notify clients */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function token(
        uint256 initialSupply,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol
        ) {
        balanceOf[msg.sender] = initialSupply;              // Give the creator all initial tokens
        totalSupply = initialSupply;                        // Update total supply
        name = tokenName;                                   // Set the name for display purposes
        symbol = tokenSymbol;                               // Set the symbol for display purposes
        decimals = decimalUnits;                            // Amount of decimals for display purposes
    }

    /* Send coins */
    function transfer(address _to, uint256 _value) {
        require (balanceOf[msg.sender] >= _value);           // Check if the sender has enough
        require (balanceOf[_to] + _value >= balanceOf[_to]); // Check for overflows
        balanceOf[msg.sender] -= _value;                     // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient
        Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place
    }

    /* Allow another contract to spend some tokens in your behalf */
    function approve(address _spender, uint256 _value)
        returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        return true;
    }

    /* Approve and then communicate the approved contract in a single tx */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData)
        returns (bool success) {    
        tokenRecipient spender = tokenRecipient(_spender);
        if (approve(_spender, _value)) {
            spender.receiveApproval(msg.sender, _value, this, _extraData);
            return true;
        }
    }

    /* A contract attempts to get the coins */
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        require (balanceOf[_from] >= _value);                 // Check if the sender has enough
        require (balanceOf[_to] + _value >= balanceOf[_to]);  // Check for overflows
        require (_value <= allowance[_from][msg.sender]);	  // Check allowance
        balanceOf[_from] -= _value;                           // Subtract from the sender
        balanceOf[_to] += _value;                             // Add the same to the recipient
        allowance[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);
        return true;
    }

    /* This unnamed function is called whenever someone tries to send ether to it */
    function () {
        revert();     // Prevents accidental sending of ether
    }
}

contract AkbankToken is owned, token {
	struct Lending {
		address supplier;
		uint8 state;
		uint amount;
		uint rate;
		uint months;
		uint lendDate;
		bytes16 linkedDebt;
	}
	
	struct Debt {
		address recipient;
		bytes16 lendId;
		uint8 state;
		uint borrowDate;
	}
	
	uint8 constant AVAILABLE	= 0;
	uint8 constant IN_PROGRESS	= 1;
	uint8 constant EXPIRED 		= 2;
	
	/* Lending and Debt Mappings */
	mapping (bytes16 => Lending) public lendings;
	mapping (bytes16 => Debt) public debts;
	mapping (address => bytes16[]) public lendingsByAddress;
	mapping (address => bytes16[]) public debtsByAddress;
	
	mapping (address => bool) public debtorAccounts;
	
	event LendingAdded(address lender, bytes16 lendingId);
	event LendingCancelled(bytes16 lendingId);
	event MoneyBorrowed(address recipient, bytes16 lendingId);

    UUIDProvider public uuidProvider = UUIDProvider(0x3ADA1c05C9baCA9815d07ec62b21B895C17FE5FC);
	
    uint256 public sellPrice;
    uint256 public buyPrice;

    mapping (address => bool) public frozenAccount;

    /* This generates a public event on the blockchain that will notify clients */
    event FrozenFunds(address target, bool frozen);

    /* Initializes contract with initial supply tokens to the creator of the contract */
    function AkbankToken(
        uint256 initialSupply,
        string tokenName,
        uint8 decimalUnits,
        string tokenSymbol
    ) token (initialSupply, tokenName, decimalUnits, tokenSymbol) 
	{
	}

	function updateUUIDProvider(address uuidAddress) onlyOwner {
		uuidProvider = UUIDProvider(uuidAddress);
	}
	
	/* Lend Money */
	function lendMoney(address _lender, uint _amount, uint _rate, uint _months, uint _timestamp) onlyOwner {
		require (!frozenAccount[_lender]);		//Check if frozen
		/* get unique id */
		bytes16 blobId = uuidProvider.UUID4();
		while (lendings[blobId].supplier != 0x0) {
			blobId = uuidProvider.UUID4();
		}
		/* add lending */
		lendings[blobId] = Lending({
			supplier: _lender,
			state: AVAILABLE,
			amount: _amount,
			rate: _rate,
			months: _months,
			lendDate: _timestamp,
			linkedDebt: 0x0
		});
		lendingsByAddress[_lender].push(blobId);
		
		LendingAdded(_lender, blobId);
	}
	
	function cancelLending(bytes16 _id) onlyOwner {
		require (lendings[_id].supplier != 0x0);		//Check if lending id is valid
		require (lendings[_id].state == AVAILABLE);		//Check if lending is available
		
		lendings[_id].state = EXPIRED; //set canceled
		
		LendingCancelled(_id);
	}
	
	/* Borrow Money */
	function borrowMoney(bytes16 _id) {
		require (!frozenAccount[msg.sender]);			//Check if frozen
		require (debtorAccounts[msg.sender]);			//Check if the sender is valid debtor
		require (lendings[_id].supplier != 0x0);		//Check if lending id is valid
		require (lendings[_id].state == AVAILABLE);	//Check if lending is available
		
		/* get unique id */
		bytes16 blobId = uuidProvider.UUID4();
		while (debts[blobId].recipient != 0x0) {
			blobId = uuidProvider.UUID4();
		}
		
		 
		/* add debt */
		debts[blobId] = Debt({
			recipient: msg.sender,
			lendId: _id,
			state: IN_PROGRESS,
			borrowDate: now
		});
		
		/* update lending */
	    lendings[_id].state = IN_PROGRESS;
	    lendings[_id].linkedDebt = blobId;

		
		debtsByAddress[msg.sender].push(blobId);
		MoneyBorrowed(msg.sender, blobId);
	}
	
	function updateDebt(bytes16 _id, uint8 _state, uint _timestamp) onlyOwner {
		require (debts[_id].recipient != 0x0);		//Check if the debt is valid
		
		debts[_id].state = _state;
		if (_state != EXPIRED) {
			debts[_id].borrowDate = _timestamp;
		}
	}
	
	function addDebtor(address _debtor) onlyOwner {
		debtorAccounts[_debtor] = true;
	}
	
	function removeDebtor(address _debtor) onlyOwner {
		debtorAccounts[_debtor] = false;
	}

    /* Send coins */
    function transfer(address _to, uint256 _value) {
        require (balanceOf[msg.sender] >= _value);           // Check if the sender has enough
        require (balanceOf[_to] + _value >= balanceOf[_to]); // Check for overflows
        require (!frozenAccount[msg.sender]);                // Check if frozen
        balanceOf[msg.sender] -= _value;                     // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient
        Transfer(msg.sender, _to, _value);                   // Notify anyone listening that this transfer took place
    }


    /* A contract attempts to get the coins */
    function transferFrom(address _from, address _to, uint256 _value) returns (bool success) {
        require (!frozenAccount[_from]);                        // Check if frozen            
        require (balanceOf[_from] >= _value);                 // Check if the sender has enough
        require (balanceOf[_to] + _value >= balanceOf[_to]);  // Check for overflows
        require (_value <= allowance[_from][msg.sender]);   // Check allowance
        balanceOf[_from] -= _value;                          // Subtract from the sender
        balanceOf[_to] += _value;                            // Add the same to the recipient
        allowance[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);
        return true;
    }

    function mintToken(address target, uint256 mintedAmount) onlyOwner {
        balanceOf[target] += mintedAmount;
        totalSupply += mintedAmount;
        Transfer(0, this, mintedAmount);
        Transfer(this, target, mintedAmount);
    }

    function freezeAccount(address target, bool freeze) onlyOwner {
        frozenAccount[target] = freeze;
        FrozenFunds(target, freeze);
    }

    function setPrices(uint256 newSellPrice, uint256 newBuyPrice) onlyOwner {
        sellPrice = newSellPrice;
        buyPrice = newBuyPrice;
    }
    
    function getUUID() returns(bytes16) {
        return uuidProvider.UUID4();
    }
    
    function getLendingsOf(address _lender) constant returns(bytes16[]) {
        return lendingsByAddress[_lender];
    }
    
    function getDebtsOf(address _debtor) constant returns(bytes16[]) {
        return debtsByAddress[_debtor];
    }
    
    function getLending(bytes16 _id) constant returns(address, uint8, uint, uint, uint, uint, bytes16) {
        return (lendings[_id].supplier, lendings[_id].state, lendings[_id].amount, lendings[_id].rate, lendings[_id].months, lendings[_id].lendDate, lendings[_id].linkedDebt);
    }
    
    function getDebt(bytes16 _id) constant returns(address, bytes16, uint8, uint) {
        return (debts[_id].recipient, debts[_id].lendId, debts[_id].state, debts[_id].borrowDate);
    }
    
    function getBalance(address _adr) constant returns (uint256) {
        return balanceOf[_adr];
    }
    
    function isDebtor(address _adr) constant returns (bool) {
        return debtorAccounts[_adr];
    }
    
    function isFrozen(address _adr) constant returns (bool) {
        return frozenAccount[_adr];
    }

    function buy() payable {
        uint amount = msg.value / buyPrice;                // calculates the amount
        require (balanceOf[this] >= amount);               // checks if it has enough to sell
        balanceOf[msg.sender] += amount;                   // adds the amount to buyer's balance
        balanceOf[this] -= amount;                         // subtracts amount from seller's balance
        Transfer(this, msg.sender, amount);                // execute an event reflecting the change
    }

    function sell(uint256 amount) {
        require (balanceOf[msg.sender] >= amount);        // checks if the sender has enough to sell
        balanceOf[this] += amount;                         // adds the amount to owner's balance
        balanceOf[msg.sender] -= amount;                   // subtracts the amount from seller's balance
        if(!msg.sender.send(amount * sellPrice)) revert();
        Transfer(msg.sender, this, amount);            // executes an event reflecting on the change
    }
}