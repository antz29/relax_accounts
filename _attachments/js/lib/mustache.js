var RA = RA || {};

(function($) {

	var template_cache = {};

	RA.Mustache = function(template) {
		
		var that = this;
		var tcontents = false;	
		var loading = false;
	
		var queue = [];

		function callQueue(tcontents) {
			var cb;
			while (cb = queue.shift()) {
				cb.c.apply(that,[Mustache.to_html(tcontents,cb.v)]);
			}
		}

		this.render = function(view,callback) {
			
			if ($.isFunction(view)) {
				callback = view;
				view = {};
			}
		
			queue.push({v:view,c:callback});
			if (loading) return;
			if (tcontents) return callQueue(tcontents);
			if (template_cache[template]) return callQueue(template_cache[template]);
			loading = true;
			$.ajax({
                        	url : template,
                                success : function(template_contents) {
					tcontents = template_contents;
					template_cache[template] = tcontents;
					loading = false;
					callQueue(tcontents);
                                }
                        }); 
		}			
	};
	
}(jQuery));
