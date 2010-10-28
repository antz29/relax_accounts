var RA = RA || {};

(function($) {
	
	RA.CouchView = function(database,design,view) {
		var that = this;
		var url = database + '/_design/' + encodeURIComponent(design) + '/_view/' + encodeURIComponent(view);		
		var params = {};
		var result = false;
		
		this.setParams = function(set_params) {
			params = set_params;
			if (set_params.key) params.key = JSON.stringify(set_params.key);
			if (set_params.startkey) params.startkey = JSON.stringify(set_params.startkey);
			if (set_params.endkey) params.endkey = JSON.stringify(set_params.endkey);
			return this;
		};
		
		this.load = function(callback) {
			var req = {
					url : url,
					data : (params.keys ? JSON.stringify({'keys' : params.keys }) : params),
					type : (params.keys ? 'post' : 'get'),
					processData : (params.keys ? false : true), 
					beforeSend: function(xr) {					
						if (params.keys) xr.setRequestHeader('content-type','application/json');
					}, 
					complete : function(xr,status) {
						if (status == 'success') {
							result = JSON.parse(xr.responseText);
							callback(that);
						}
						else {
							throw "Failed to retrieve document. Status: " + xr.status + ' - ' + xr.statusText;
						}
					}
				};
			$.ajax(req);
		};
		
		this.total = function() {
			if (!result) return false;
			
			return result.total_rows;
		};
		
		this.each = function(iterator) {
			if (!result) return false;
			
			$.each(result.rows,function(k,v) {
				iterator(v.id,v.key,new RA.CouchDocument(database, v.value));
			});
		};
		
		this.getRow = function(row) {
			if (!result || !result.rows[row]) return false;
			var res = result.rows[row];
			return {id : res.id,key: res.key,doc:new RA.CouchDocument(database, res.value)};
		};
		
		this.getRows = function() {
			if (!result) return false;
			var ret = [];
			_.each(result.rows,function(row) {
				ret.push(row.value);
			});
			return ret;
		};
		
	};
	
}(jQuery));