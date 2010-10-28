_.mixin({
	queue : function (queue,callback) {
		
		callback = callback || function() {};

               	function exec() {
                	var cur = queue.shift();
                	if (!cur) return false;
                	if (queue.length) {
                		cur.apply({},[exec]);
                	}
                	else {
                		cur.apply({},[callback]);
                	}
                	return true;
                }

                if (!exec()) {
                	callback();
        	}
	}
});
