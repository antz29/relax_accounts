var RA = RA || {};

(function($) {
	
	RA.RulesEngine = function(parser) {
		var that = this;
		var rules = [];
		
		var events = {
			'progress' : []
		};
	
		function trigger(event,data) {
			_.each(events[event],function(h) {
				h.apply(that,[data]);
			});
		};
	
		this.loadRules = function(callback) {
			var rl = new RA.CouchView(DB,'relax','rules');
			rl.load(function() {
				rl.each(function(id,key,value) {
					rules.push(eval('(' + value.doc.rule + ')'));
				});
				callback();
			});
		};
				
		this.getRules = function() {
			return rules;
		};

		this.applyRule = function(rule) {
			var remove = false;
			_.each(trans,function(rule) {
				if (rule.apply(tran) === false) {
					remove = true;
					_.breakLoop();
				}
			});
			return remove ? false : true;
		};

		this.go = function() {
			var trans = parser.getValidTrans();
			var total = rules.length * trans.length;
			var prg = 0;
			var tprg = 0;
			_.each(rules,function(rule) {
				_.each(trans,function(tran) {
					if (rule.apply(tran) === false) {
						parser.deleteByUid(tran.getUid());
					}
					prg = prg + 1;
					var ntprg = Math.round((prg / total) * 100);
					if (ntprg != tprg) {
						tprg = ntprg;
						trigger('progress',{complete : tprg});
					}
				});
			});
		};

		this.getTrans = function() {
			return trans;
		};
		
		this.on = function(event,callback) {
			if (!events[event]) return false;
			events[event].push(callback);
		};
	};
	
}(jQuery));

