_.mixin({
	cache : function (timeout,func)
	{
		if ($.isFunction(timeout)) {
			func = timeout;
			timeout = false;
		}
	
		var cache;
		var queue = [];
		var loading = false;

		function callQueue() {
			var args = Array.prototype.slice.call(arguments);
			var cb;
			while (cb = queue.shift()) {
				cb.apply(this,args);
			}
		}

		return function() {
			var args = Array.prototype.slice.call(arguments);
			var callback = args.pop();
			queue.push(callback);
			if (loading) return;
			if (cache != undefined) callQueue.apply(this,cache);
			loading = true;
			args.push(function() {
				var args = Array.prototype.slice.call(arguments);
				cache = args;
				if (timeout) {
					setTimeout(function() {
						cache = undefined;
					},timeout);
				}
				callQueue.apply(this,args);
				loading = false;
			});
			func.apply(this,args);
		}
	}
});
