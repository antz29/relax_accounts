var RA = RA || {};

(function($) {
	
	RA.Action = function() {
				
		var name = name;
		var view = {}; 
		var template = false; 
		var state = {};
		var module = false;
		
		this.getName = function() {
			return name;
		};
		
		this.getView = function() {
			return view;
		};
		
		this.setName = function(new_name) {
			name = new_name;
		};
		
		this.getTemplate = function() {
			return template;
		};
		
		this.setTemplate = function(new_template) {
                        template = new RA.Mustache('js/views/' + new_template + '.mst');
		};
		
		this.getState = function() {
			return state;
		};
		
		this.getModule = function() {
			return module;
		};
		
		this.setModule = function(set_module) {
			module = set_module;
		};
		
		this.go = function(callback) { callback(); };
		this.postRender = function() { }; 
		
		this.exec = function(new_state,callback) {
			this.setTemplate(_.underscore(this.getModule().getName()) + '/' + _.underscore(this.getName()));
			
			state = new_state;

			this.go(function() {
				template.render(view,function(contents) {
					callback(contents);
				});
			});
		};
		
	};
	
}(jQuery));
