// #PROVIDES: controller.accounts

CMVC.Controller = CMVC.Controller || {};

(function($) {
	
	CMVC.Controller.Accounts = function() {
		RA.Controller.call(this); 
		
		var that = this;
		
		this.indexAction = function(callback) {			
			var out = that.getView();
			
			var bal = new RA.CouchView(DB,'relax','balances');
			
			bal.setParams({group:true}).load(function() {
			
				var balances = {};
				
				bal.each(function(id,key,value) {
					balances[key] = value;
				});
				
				var acc = new RA.CouchView(DB,'relax','accounts');
				acc.load(function() {
					var types = {};
					
					acc.each(function(id,key,value) {
						types[key[0]] = types[key[0]] || {};
						types[key[0]]['name'] = key[0];
						types[key[0]]['accounts'] = types[key[0]]['accounts'] || [];
						types[key[0]]['balance'] = types[key[0]]['balance'] || 0; 
						var bal = balances[value.doc._id] ? balances[value.doc._id].doc : 0;
						bal = ((value.doc.opening_balance + bal) / 100);
						types[key[0]]['balance'] += bal;
						value.doc.balance = bal.toFixed(2);
						value.doc.negative = false;
						value.doc.positive = false;
						if (bal < 0) {
							value.doc.negative = true;
						}
						else if (bal > 0) {
							value.doc.positive = true;
						}
						types[key[0]]['accounts'].push(value.doc);
					});
					
					out.types = [];
					$.each(types,function(key,val) {
						val.balance = val.balance.toFixed(2);
						out.types.push(val);
					});
					
					callback();
				});	
			});	
		};
		
		this.addAction = function(callback) {
			that.setTemplate('shared/form');
			var state = that.getState();
			
			that.getView().title = 'Add Account';
			that.getView().save_label = 'Save account and continue';
			that.getView().cancel_label = 'Cancel adding account';	
			var fields = [];
			
			fields.push({
				id : 'name',
				label : 'Name',
				type : 'text',
				input : true
			});
			
			fields.push({
				'id' : 'opening_balance',
				'label' : 'Opening Balance',
				'type' : 'text',
				'class' : 'money',
				'input' : true
			});
			
			fields.push({
				id : 'account_type',
				label : 'Account Type',
				select : true,
				options : [
				     {value : 'Cash',label : 'Cash'},
				     {value : 'Current',label : 'Current'},
				     {value : 'Savings',label : 'Savings'},
				     {value : 'Credit Card',label : 'Credit Card'},
				     {value : 'Loan',label : 'Loan'}
				]
			});
			
			that.getView().fields = fields;
			
			callback(function() {
				$('#name').change(function() {
					$(this).data('value',
						$(this).val().toLowerCase().replace(' ','_').replace(/[^a-z0-9_]/g,'')
					);
				});
				
				$('button.ok').click(function() {
					
					var acc = new RA.CouchDocument(DB,$('#name').data('value'));	
										
					acc.doc.type = 'account';
					acc.doc._id = $('#name').data('value');
					acc.doc.name = $('#name').val();
					acc.doc.opening_balance = $('#opening_balance').data('value');
					acc.doc.account_type = $('#account_type').val();
					
					var out_height = $('#main').outerHeight();
					var load_height = (out_height < 200) ? 200 : out_height;
					$('#loading').height(load_height).show();
					
					acc.save(function() {
						location = '#module=accounts/edit&account=' + acc.doc._id;
					});	
					
				});
				
				$('button.cancel').click(function() {
					location = '#module=accounts';
				});
			});
		};
		
		this.deleteAction = function(callback) {
			that.setTemplate('shared/delete');
			var state = that.getState();
			
			that.getView().title = 'Add Account';
			that.getView().save_label = 'Yes, delete this account.';
			that.getView().cancel_label = 'No, I have changed my mind.';			
			that.getView().confirm_message = 'Are you sure you want to delete this account?';
			
			callback(function() {				
				$('button.ok').click(function() {
					
					var acc = new RA.CouchDocument(DB,state.account);
					
					var out_height = $('#main').outerHeight();
					var load_height = (out_height < 200) ? 200 : out_height;
					$('#loading').height(load_height).show();					
					
					acc.del(function() {
						location = '#module=accounts';
					});										
				});
				
				$('button.cancel').click(function() {
					location = '#module=accounts';
				});
			});
		};
		
		this.editAction = function(callback) {
			that.setTemplate('shared/form');
			var state = that.getState();
			
			var acc = new RA.CouchDocument(DB,state.account);
			acc.load(function() {
				that.getView().title = 'Edit Account : ' + acc.doc.name;
				that.getView().save_label = 'Save Account';
				that.getView().cancel_label = 'Cancel editing account';	
				that.getView().delete_label = 'Delete this account';
				var fields = [];
				
				fields.push({
					id : 'name',
					label : 'Name',
					value : acc.doc.name,
					type : 'text',
					input : true
				});
				
				fields.push({
					'id' : 'opening_balance',
					'label' : 'Opening Balance',
					'value' : acc.doc.opening_balance,
					'type' : 'text',
					'class' : 'money',
					'input' : true
				});
								
				switch(acc.doc.account_type) {
					case 'Credit Card':
						fields.push({
							id : 'credit_limit',
							label : 'Credit Limit',
							value : acc.doc.credit_limit,
							'class' : 'money',
							type : 'text',
							input : true
						});			
					case 'Loans':
					case 'Savings':
						fields.push({
							id : 'interest_rate',
							label : 'Interest Rate',
							value : acc.doc.interest_rate,
							'class' : 'money',
							type : 'text',
							input : true
						});
						fields.push({
							id : 'interest_calc_day',
							label : 'Interest Calculation Day',
							value : acc.doc.interest_calc_day,
							'class' : 'int',
							type : 'text',
							input : true
						});	
						break;
				}
				
				fields.push({
					id : 'account_type',
					disabled : true,
					label : 'Account Type',
					select : true,
					options : [
					     {value : 'Cash',label : 'Cash',selected : (acc.doc.account_type == 'Cash')},
					     {value : 'Current',label : 'Current',selected : (acc.doc.account_type == 'Current')},
					     {value : 'Savings',label : 'Savings',selected : (acc.doc.account_type == 'Savings')},
					     {value : 'Credit Card',label : 'Credit Card',selected : (acc.doc.account_type == 'Credit Card')},
					     {value : 'Loan',label : 'Loan',selected : (acc.doc.account_type == 'Loan')}
					]
				});
				
				that.getView().fields = fields;
				
				callback(function() {		
					$('input.money').each(function() {
						$(this).data('value',parseInt($(this).val()));
						$(this).val(($(this).val() / 100).toFixed(2));
					});
					
					$('input.int').each(function() {
						var val = parseInt($(this).val());
						$(this).data('value',val);
						$(this).val(val);
					});
					
					$('button.delete').click(function() {
						if(confirm('Are you sure you want to delete this account?')) {
							acc.del(function() {
								location = '#module=accounts';
							});
						}
					});
					
					$('button.ok').click(function() {
						acc.doc.name = $('#name').val();
						acc.doc.opening_balance = $('#opening_balance').data('value');
						var out_height = $('#main').outerHeight();
						var load_height = (out_height < 200) ? 200 : out_height;
						$('#loading').height(load_height).show();
						acc.save(function() {
							location = '#module=accounts';
						});
					});
					
					$('button.cancel').click(function() {
						location = '#module=accounts';
					});
				});
			});
		};
		
	};
	
}(jQuery));
