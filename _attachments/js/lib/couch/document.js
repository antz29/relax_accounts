var RA = RA || {};

(function($) {
	
	RA.CouchDocument = function(database,doc_id) {
		
		var that = this;	
		var revision = false;
		var create = true;
		this.doc = {};
		
		if (doc_id && !_.isString(doc_id)) {
			this.doc = doc_id;
			revision = this.doc._rev;
			delete this.doc._rev;
			
			create = false;			
		}
		
		this.getRevision = function() {
			return revision;
		};
		
		this.load = function(load_doc,callback) {
			
			if (_.isFunction(load_doc)) {
				callback = load_doc;
				load_doc = doc_id;
			}
			else {
				callback = function() {};
				load_doc = doc_id;
			};
			
			if (!load_doc) throw("No document id specified to load");
			
			$.ajax({
				url : database + '/' + encodeURIComponent(load_doc),
				type : 'get',
				complete : function(xr,status) {
					if (status == 'success') {
						that.doc = JSON.parse(xr.responseText);
						revision = that.doc._rev;
						delete that.doc._rev;
						create = false;
						callback();
					}
					else {
						throw "Failed to retrieve document. Status: " + xr.status + ' - ' + xr.statusText;
					}
				}
			});	
		};
		
		this.save = function(callback) {
			var doc = jQuery.extend(true, {}, this.doc);
			
			if (!create) {
				if (!this.doc._id) return;
				doc._rev = revision;
			}
			else {
				doc._id = doc_id;
			}
			
			$.ajax({
				url : database + '/' + encodeURIComponent(doc_id),
				type : 'put',
				data : JSON.stringify(doc),
				processData : false,
				complete : function(xr,status) {
					if (xr.status == 201) {
						var resp = JSON.parse(xr.responseText);
						revision = resp.rev;
						callback();
					}
					else {
						throw "Failed to retrieve document. Status: " + xr.status + ' - ' + xr.statusText;
					}
				}
			});
		};
		
		this.del = function(callback) {
			if (!this.doc._id) {
				return that.load(function() {
					that.del(callback);
				});
			};
			
			$.ajax({
				url : database + '/' + encodeURIComponent(this.doc._id) + '?rev=' + revision,
				type : 'delete',
				complete : function(xr,status) {
					if (xr.status == 200) {
						that.doc = {};
						revision = false;
						create = true;
						callback();
					}
					else {
						throw "Failed to retrieve document. Status: " + xr.status + ' - ' + xr.statusText;
					}
				}
			});
		};
		
	};
	
}(jQuery));
