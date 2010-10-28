var RA = RA || {};

(function($) {
	RA.Transaction = function() {
		var that = this;

		this.transaction = {
			'uid' : null,
			'payee' : null,
			'description' : null,
			'status' : 'cleared',
			'method' : null,
			'date' : null,
			'value' : 0,
			'account' : null,
		};
		
		this.setCategory = function(category,split) {
			if (split != undefined) {
			this.transaction.splits[split].category = category;
				return this;
			}
			this.transaction.category = category;
			return this;

		};

		this.setUid = function(uid) {
			this.transaction.uid = hex_md5(uid);
		};

		this.setPayee = function(payee,split) {
			if (split != undefined) {
				this.transaction.splits[split].payee = payee;
				return this;
			}
			this.transaction.payee = payee;
			return this;
		};

		this.setDescription = function(description,split) {
			if (split != undefined) {
				this.transaction.splits[split].description = description;
				return this;
			}
			this.transaction.description = description;
			return this;
		};

		this.setTransfer = function(transfer,split) {
			if (split != undefined) {
				this.transaction.splits[split].transfer = transfer;
				return this;
			}
			this.transaction.transfer = transfer;
			return this;
		};


		this.setStatus = function(status) {
			this.transaction.status = status;
			return this;
		};

		this.setMethod = function(method) {
			this.transaction.method = method.toLowerCase();
			return this;
		};

		this.setDate = function(year,month,day) {
			this.transaction.date = new Date(year,month,day);
			return this;
		};

		this.setValue = function(value,split) {
			value = Math.round(value * 100);
			if (split != undefined) {
				var total = this.getTotal() - this.transaction.splits[split].value;
				total = total + value;
				var diff = this.getTotal() - total;
				total = this.transaction.value + diff;
				this.transaction.value = this.transaction.value + diff;
				this.transaction.splits[split].value = value;
				return this;
			}
			this.transaction.value = value; 
			return this;
		};

		this.setAccount = function(account,split) {
			if (split != undefined) {
				this.transaction.splits[split].account = account;
				return this;
			}
			this.transaction.account = account;
			return this;
		};

		this.getUid = function() {
			return this.transaction.uid;
		};

		this.getPayee = function(split) {
			if (split != undefined) {
				return this.transaction.splits[split].payee;
			}
			return this.transaction.payee;
		};
	
		this.getTransfer = function(split) {
			if (split != undefined) {
				return this.transaction.splits[split].transfer;
			}
			return this.transaction.transfer;
		};
	
		this.getDescription = function(split) {
			if (split != undefined) {
				return this.transaction.splits[split].description;
			}
			return this.transaction.description;
		};

		this.getStatus = function() {
			return this.transaction.status;
		};

		this.getMethod = function() {
			return this.transaction.method;
		};

		this.getDate = function() {
			return this.transaction.date;
		};

		this.getValue = function(split) {
			if (split != undefined) {
				return (this.transaction.splits[split].value / 100).toFixed(2);
			}
			return (this.transaction.value / 100).toFixed(2);
		};
	
		this.getCategory = function(split) {
			if (split != undefined) {
				return this.transaction.splits[split].category;
			}
			return this.transaction.category;	
		};

		this.getAccount = function(split) {
			if (split != undefined) {
				return this.transaction.splits[split].account;
			}		
			return this.transaction.account;
		};

		this.isSplit = function() {
			if (!this.transaction.splits) return false;
			return this.transaction.splits.length ? true : false;
		};

		this.getSplits = function() {
			return this.transaction.splits;
		};

		this.addSplit = function(value) {
			value = Math.round(value * 100);

			if (!this.transaction.value) throw "Must set a total value before you can split a transaction.";
		
			var v1 = (this.transaction.value < 0) ? this.transaction.value * -1 : this.transaction.value;
			var v2 = (value < 0) ? value * -1 : value;
			if (v1 < v2) throw "Split value must not be higher that the total remaining value";

			this.transaction.value = this.transaction.value - value;
			
			if (!this.transaction.splits) this.transaction.splits = [];

			this.transaction.splits.push({
				value : value
			});

			return (this.transaction.splits.length - 1);
		};
		
		this.delSplit = function(split) {
			var val = this.transaction.splits[split].value;
			this.transaction.value = this.transaction.value + val;
			delete this.transaction.splits[split];
		};
		
		this.validate = function(full) {
			if (!full) return (
				this.transaction.uid && 
				this.transaction.payee && 
				this.transaction.method && 
				this.transaction.date && 
				this.transaction.value
			);

			return (
				this.transaction.uid && 
				this.transaction.payee && 
				this.transaction.method && 
				this.transaction.date && 
				this.transaction.value && 
				this.transaction.category
			);
		};

		this.getTotal = function() {
			var tot = this.transaction.value;

			if (this.transaction.splits && this.transaction.splits.length) {
				_.each(this.transaction.splits,function(spl) {
					tot += spl.value;
				});
			}

			return (tot / 100).toFixed(2);
		}
	
		//Convienience methods for rules
		var replaceVarContains = function(param,search,replace) {
			if (!that.transaction[param]) return false;
			var val = that.transaction[param];
			if (val.toLowerCase().indexOf(search.toLowerCase()) != -1) {
				that.transaction[param] = replace;
				return true;
			}
			return false;
		};

		this.replacePayeeContains = function(search,replace) {
			return replaceVarContains('payee',search,replace);
		};

		this.replaceDescriptionContains = function(search,replace) {
			return replaceVarContains('description',search,replace);
		};

		this.splitOnCategory = function(category,amount) {
			var split = this.addSplit(amount);
			this.setCategory(category,split);
		};

		this.splitOnAccount = function(account,amount) {
			var split = this.addSplit(amount);
			this.setAccount(account,split);
		};

		this.splitOnPayee = function(payee,amount) {
			var split = this.addSplit(amount);
			this.setPayee(payee,split);
		};

		this.splitOnDescription = function(description,amount) {
			var split = this.addSplit(amount);
			this.setDescription(description,split);
		};
	};
}());
