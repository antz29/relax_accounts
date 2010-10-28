var RA = RA || {};

(function($) {
	
	RA.StatementParse = function(data,type,parsed) {
		var parser;	
		var timeout = false;

		var timer = setTimeout(function() {
			timeout = true;
			return parsed({ isValid : function() { return false; } });
		},5000);
	
		dominoes('parser.' + type,function() {
			if (timeout) return;
			clearTimeout(timer);
			var obj = _.camelize(type) + 'Parser';
			console.log(obj);
			try {
				parser = new RA[obj](data);
				parser.parse(parsed);	
			}
			catch (e) {
				console.log(e);
				return parsed({ isValid : function() { return false; } });
			} 
		});		
	};
	
}(jQuery));
