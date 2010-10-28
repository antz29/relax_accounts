var RA = RA || {};

(function($) {
	
	RA.Transactions.Rules = function() {
		RA.Action.call(this); 
		
		var that = this;
	
		var editor;
	
		this.go = function(callback) {
			var rules = new RA.CouchView(DB,'relax','rules');
			rules.load(function() {
				that.getView().rules = rules.getRows();
				callback();
			});
		};
		
		this.postRender = function(callback) {
		
			editor = new CodeMirror($('#editor').get(0),
			{
				height: "500px",
				parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
				stylesheet: "/accounts/_design/relax/vendor/codemirror/js.css",
				path: "/accounts/_design/relax/vendor/codemirror/",
				autoMatchParens: true,
				lineNumbers: false
			});

			setTimeout( function() { callback(); }, 500) ;
	
			/*	
			$('.rule a.name').click(function() {
				var crule = new RA.CouchDocument(DB,$(this).closest('.rule').attr('id'));
				crule.load(function() {
					editor.setCode(crule.doc.rule);
					$('#editor input.name').val(crule.doc.name);
					$('#editor').show();
					
					$('#editor button.cancel').one('click',function() {
						$('#editor').hide();
					});
					
					$('#editor button.save').one('click',function() {
						crule.doc.rule = editor.getCode();
						crule.doc.name = $('#editor input.name').val();
						crule.save(function() {
							$('#' + crule.doc._id + ' a.name').text(crule.doc.name);
							$('#editor').hide();
						});
					});
				});
			});

			$('.rule button.del').click(function() {
				var crule = new RA.CouchDocument(DB,$(this).closest('.rule').attr('id'));
				var rule = $(this).closest('div.rule');
                                crule.del(function() {
					rule.remove();
                                });
			});

			$('#add').click(function() {
			
			});

			var actions = {
				'add' : function() {
					$('#add').trigger('click');
				},
				'show' : function() {
					$('#' + that.getState('rule')).find('a.name').trigger('click');
				}
			};

			actions[this.getState('action')]();
			*/
		}

		this.add = function() {
			$('#editor input.name').val('Untitled');
			editor.setCode('function() {\n\treturn true;\n}');
			
			$('#editor').show();
				
			$('#editor button.cancel').one('click',function() {
				location.hash = 'module=transactions/rules';
                        });

                        $('#editor button.save').one('click',function() {
				var id = _.trim($('#editor input.name').val()).toLowerCase().replace(' ','_');
				var crule = new RA.CouchDocument(DB,id);
				crule.doc.type = 'rule';
                               	crule.doc.rule = editor.getCode();
                                crule.doc.name = $('#editor input.name').val();
                                crule.save(function() {
                                	$('#editor').hide();
					location = '#module=transactions/rules';
                                });
                        });		
		};

		this.show = function() {
			var crule = new RA.CouchDocument(DB,this.getState().rule);
					
			$('#editor button.save').one('click',function() {
				crule.doc.rule = editor.getCode();
				crule.doc.name = $('#editor input.name').val();
				crule.save(function() {
					$('#' + crule.doc._id + ' a.name').text(crule.doc.name);
					location.hash = 'module=transactions/rules'
				});
			});

			$('#editor button.cancel').one('click',function() {
				location.hash = 'module=transactions/rules';
                        });
			
			crule.load(function() {
				editor.setCode(crule.doc.rule);
				$('#editor input.name').val(crule.doc.name);
				$('#editor').show();
			})
		};
	};
	
}(jQuery));
