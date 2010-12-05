// #PROVIDES: uploader
// #DEPENDS: rules, !parser, !parser.ofx

var RA = RA || {};

(function($) {
	RA.Uploader = function() {

		var that = this;
		var data = false;
		var account = false;
		var transactions = [];
		
		var ac = false;
		var act; 

		var dialog = $('<div/>').dialog({
			autoOpen: false,
			title: 'Upload Statement',
			height: 500,
			width: 800,
			resizable: false,
			draggable: false,
			modal: true,
			closeOnEscape: false			
		});	

		var tpath = RA.Uploader.settings.template_path;

		function setDisplay(template,view,callback) {
			if ($.isFunction(view)) {
				callback = view;
				view = {};
			}
			var tmpl = new RA.Mustache(tpath + template);
			tmpl.render(view,function(contents) {
				dialog.dialog('widget').find('.ui-widget-content').html(contents);
				callback();
			});
		};

		function callbackQueue(queue,callback) {
			function exec() {
				var cur = queue.shift();
				if (!cur) return false;
				if (queue.length) {
					cur.apply(that,[exec]);
				}
				else {
					cur.apply(that,[callback]);
				}
				return true;
			} 

			if (!exec()) {
				callback();
			}
		};

		function loadFile(callback) {
			dialog.dialog('option','title','Upload Statement : Select file');
			setDisplay('load_file.mst',function() {
				dialog.dialog('open');
				$('#statement').change(function() {
					var file = this.files[0];
					var type = file.name.split('.').pop();
					if (!file) return;
					$('#statement').attr('disabled',true);
					$('#loading-file').text('Loading file...').show();
					var reader = new FileReader();
					reader.onload = function(e) {
						var file_data = e.target.result;
						RA.StatementParse(file_data,type,function(parser) {
							data = parser;
							if (!data.isValid()) {
								$('#loading-file').text('Invalid statement format!');
								$('#statement').val('').attr('disabled',false);
								return;
							}
							callback();
						});
					};
					reader.readAsText(file);
				});
			});
		};
	
		function selectAccount(callback) {
			dialog.dialog('option','title','Upload Statement : Select account');
			var acc = new RA.CouchView(DB,'relax','accounts_by_name');
			var view = {};
			acc.load(function() {
				view.accounts = acc.getRows();
				setDisplay('select_account.mst',view,function() {
					$('.account').one('click',function() {
						account = $(this).attr('id');
						callback();
					});		
				});
			});				
		};
	
		function applyRules(callback) {
			dialog.dialog('option','title','Upload Statement : Applying rules');
			var re = new RA.RulesEngine(data,account);
			setDisplay('apply_rules.mst',function() {
				var progress = $( "#rules-progress" ).progressbar({ value : 0 });
				re.on('progress',function(e) {
					progress.progressbar('option','value',e.complete);	
				});		
				re.loadRules(function() {
					re.go();
					callback();
				});
			});
		};

		function validateTransactions(callback) {
			dialog.dialog('option','title','Upload Statement : Validate transactions');	
			
			var getAccountName = function (id,callback) {
				getAccounts(function(accounts) {
					var name = accounts[id];
					callback(name);
				});
			};
	
			function formatTrans(tran,callback) {
				var tcp = $.extend(true,{},tran);
				var t = $.extend(true,{},tcp.transaction);
				t.value = tcp.getValue();
				var dt = tcp.getDate();
				t.odate = dt;
				t.date = dt.getDate() + ' / ' + dt.getMonth() + ' / ' + dt.getFullYear();
				t.valid = tcp.validate(true);
				t.invalid = !t.valid;

				function handleSplits() {
					var loading = 0;
					t.splits = tcp.isSplit() ? tcp.getSplits() : false;
					_.each(t.splits,function(spl,i) {
						t.splits[i].value = tcp.getValue(i);
						if (spl.transfer) {
							loading++;
							getAccountName(t.transfer,function(name) {
								var dir = (spl.value < 0) ? 'To' : 'From';
								t.splits[i].transfer = dir + ' ' + name;
								loading--;
							});
						}
					});
	
					var waitReady = function() {
						if (loading > 0) {
							setTimeout(waitReady,25);
						}
						else {
							callback(t);
						}
					};
				
					waitReady();
				};
	
				if (!t.description) t.description = 'No Description';
				if (!t.category) {
					t.category = 'No Category';
				}

				if (t.transfer) {
					getAccountName(t.transfer,function(name) {
						var dir = (t.value < 0) ? 'To' : 'From';
						t.transfer = dir + ' ' + name;
						handleSplits();
					});					
				}
				else {
					t.transfer = 'No Transfer';
					handleSplits();
				}

			};

			setDisplay('validate.mst',function() {
				var progress = $('#validating').progressbar({value : 0});
				var t = new RA.Mustache(RA.Uploader.settings.template_path + 'transaction.mst');
				var trans = [];
				_.each(data.getValidTrans(),function(tran) {
					formatTrans(tran,function(ft) {
						t.render({ transaction : ft },function(tr) {
							var tr = $(tr);
							tr.data('transaction',tran);
							trans.push(tr);
						});		
					});
				});

				function waitReady() {
					var tprg = Math.round((trans.length / data.getValidTrans().length) * 100);
					 progress.progressbar('option','value',tprg);
					if (tprg == 100) {
						progress.hide();
						_.each(
							_.sortBy(trans,function(val) { 
								var dat = val.data('transaction');
								return dat.getDate().getTime() * -1; 
							}), 
							function (tr) {
								$('#validate-trans').append(tr);
							}
						);
						callback();
					}
					else {
						setTimeout(waitReady,100);
					}
				};
				
				waitReady();

			});
		};

		var getAccounts = _.cache(30000,function(callback) {
			var acc = new RA.CouchView(DB,'relax','accounts');
			acc.load(function() {
				var accounts = {};
				acc.each(function(id,key,value) {
					accounts[id] = value.doc.name;
				});
				callback(accounts);
			});
		});

		var getCategories = _.cache(10000,function(callback) {
			var acc = new RA.CouchView(DB,'relax','categories');
			acc.setParams({group : true}).load(function() {
				var cats = {};
				acc.each(function(id,key,value) {
					var spl = key.split('/');
					spl = _.map(spl,function(val) {return _.trim(val)});
					if (!cats[spl[0]]) cats[spl[0]] = {};
					if (spl[1]) cats[spl[0]][spl[1]] = true;
				});
			
				$('#validate-trans .transaction').each(function() {
					var key = $(this).find('.category').text();
					if (key == 'No Category') return;
					var spl = key.split('/'); 
					spl = _.map(spl,function(val) {return _.trim(val)});
					if (!cats[spl[0]]) cats[spl[0]] = {};
					if (spl[1]) cats[spl[0]][spl[1]] = true;	
				});
			
				_.each(cats,function(scats,i) {
					cats[i] = _.keys(scats);
				});
				callback(cats);
			});
		});
		
		var getPayees = _.cache(10000,function(callback) {
			var pay = new RA.CouchView(DB,'relax','payees');
			pay.setParams({group : true}).load(function() {
				var payees = [];
				pay.each(function(id,key,value) {
					payees.push(key);
				});
			
				$('#validate-trans .transaction').each(function() {
					var pays = $(this).find('.payee');
					pays.each(function() {
						var payee = $(this).text();
						if (payee == 'No Payee') return;
						payees.push(_.trim(payee));
					});	
				});
				
				payees = _.uniq(payees).sort();
				
				console.log(payees);

				callback(payees);
			});
		});

		function editTransactions(callback) {

			var editing = false;		
	
			$('#validate-trans .transaction .payee.edit').data('method','Payee');
			$('#validate-trans .transaction .description.edit').data('method','Description');
			$('#validate-trans .transaction .value.edit').data('method','Value').data('editor',$('<input/>').css('textAlign','right'));
			$('#validate-trans .transaction .date.edit').data('method','Date');
			$('#validate-trans .transaction .category.edit').data('method','Category');	
	
			$('#validate-trans .transaction .edit').click(function() {
				//if (editing) return;
				//editing = true;
				if (!$(this).data('method')) return;
				var target = $(this);
				var tran = $(this).closest('.transaction').data('transaction');
				var method = $(this).data('method');
				var editor = $('<div/>').addClass('editing ui-widget-header ui-corner-all');
				var input;
				if ($(this).data('editor')) {
					input = $(this).data('editor').clone(true);
				}
				else {
					input = $('<input/>');
				}
				input = input.val($(this).text()).width($(this).width());
				input.addClass('ui-corner-left');
				if (input.val() == 'No ' + method) {
					input.val('');
				}

				var ok = $('<button/>')
					.addClass('hover ui-button ui-widget ui-state-default ui-button-icon-only')
					.attr('title','Save')
					.height(24).width(24);
				ok.append($('<span/>').addClass('ui-button-icon-primary ui-icon ui-icon ui-icon-check'));	
				ok.append($('<span/>').addClass('ui-button-text').text('Save'));			

				var cancel = $('<button/>')
					.addClass('hover ui-button ui-widget ui-state-default ui-corner-right ui-button-icon-only')
					.attr('title','Cancel')
					.height(24).width(24);
				cancel.append($('<span/>').addClass('ui-button-icon-primary ui-icon ui-icon ui-icon-closethick'));
				cancel.append($('<span/>').addClass('ui-button-text').text('Cancel'));
				
				var rule = $('<button/>')
					.addClass('hover ui-button ui-widget ui-state-default ui-button-icon-only')
					.attr('title','Create rule from selection').attr('disabled',true)
					.height(24).width(24);
				rule.append($('<span/>').addClass('ui-button-icon-primary ui-icon ui-icon ui-icon-gear'));
				rule.append($('<span/>').addClass('ui-button-text').text('Create rule from selection'));

				editor.append(input).append(ok).append(rule).append(cancel);
				$('body').append(editor);
				editor.position({my : 'left top',at : 'left top',of: target,offset:'-10px -8px'}).css('zIndex',10000);

				if (method == 'Date') {
					ok.remove();
					input.datepicker({
						dateFormat : 'd / m / yy',
						onSelect : function(date) {
							tran['set' + method]($(this).datepicker('getDate'));
							target.text(date);
							$(this).datepicker('destroy');
							editor.empty().remove();
							editing = false;
						}
					});	
				}
				
				if (method == 'Category') {
					input.autocomplete({
						minLength : 0,
						source : function(request, response) {
							var search = request.term.split('/');
							search = _.map(search,function(val) {return _.trim(val)});
							getCategories(function(cats) {
								var source = [];
								if (search.length == 1) {
									response($.ui.autocomplete.filter(_.keys(cats),search[0]));
								}
								else if (search.length > 1) {
									var scats = cats[search[0]] ? cats[search[0]] : [];
									response($.ui.autocomplete.filter(scats,search.pop()));
								}
							});
						},
						focus : function() {
							return false;
						},
						open : function() {
							ac = true;
							clearTimeout(act);
						},
						close : function() {
							act = setTimeout(function() { ac = false; },250);
						},
						select : function(event, ui) {
							var terms = this.value.split('/');
							terms = _.map(terms,function(val) {return _.trim(val)});
							terms.pop();
							terms.push( ui.item.value );
							this.value = terms.join(' / ');
							return false;
						}
					});
				}

				if (method == 'Payee') {
					input.autocomplete({
						minLength : 1,
						source : function(request, response) {
							getPayees(function(payees) {
								response(_.first(_.uniq($.ui.autocomplete.filter(payees,request.term)).sort(),15));
							});
						},
						open : function() {
							ac = true;
							clearTimeout(act);
						},
						close : function() {
							ac = false;
							act = setTimeout(function() { ac = false; },250);
						}
					});	
				}

				input.get(0).focus();
				
				var testSelection = function() {
					if (input.caret().text.length) {
						rule.attr('disabled',false);
						rule.addClass('ui-state-active');
						setTimeout(testSelection,100);
					}
					else {
						rule.attr('disabled',true);
						rule.removeClass('ui-state-active');
					}
				};
	
				input.select(testSelection);				

				rule.click(function() {
					var val = input.caret().text;
					input.val(val).attr('disabled',true);
					editor.append($('<span/>').css({'float':'left','clear':'left','marginRight':'3px','marginTop':'10px'}).text('Replace with:'));
					var new_rule = $('<input/>').css({'marginTop':'5px'}).width(293).addClass('ui-corner-all').val(val);
					editor.append(new_rule);
					new_rule.get(0).focus();
					new_rule.get(0).select();
					
				});
	
				cancel.click(function(e) {
					editor.empty().remove();
					return false;
				});
				
				input.keyup(function(e) {
					switch (e.which) {
						case 27:
							if (ac) return;
							cancel.trigger('click');
							break;
						case 13:
							if (ac) return;
							ok.trigger('click');
							break;
					}
				});

				ok.click(function() {
					var val = _.trim(input.val());
					tran['set' + method](input.val() ? input.val() : null);
					if (!input.val()) {
						target.text('No ' + method);
					}
					else {
						target.text(tran['get' + method]());
					}
					if (method == 'Category') {
						var terms = target.text().split('/');
						terms = _.map(terms,function(val) { return _.trim(val); });
						target.text(terms.join(' / '));
					}
					editor.empty().remove();

					var row = target.closest('.transaction');
					row.removeClass('valid invalid');
					if ( tran.validate(true) ) row.addClass('valid');
					if ( !tran.validate(true) ) row.addClass('invalid');

					return false;
				});
			});
		};

		this.start = function() {
			callbackQueue([
				loadFile,
				selectAccount,
				applyRules,
				validateTransactions,
				editTransactions
				//upload
			],function() {

			});
		};
	};
	RA.Uploader.settings = {
template_path : 'js/lib/uploader/templates/'
	};
}(jQuery));
