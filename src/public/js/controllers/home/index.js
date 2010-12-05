// #PROVIDES: controller.home.index

var RA = RA || {};

(function($) {
	
	RA.Home.Index = function() {
		RA.Action.call(this);		
				
		this.go = function(callback) {
			this.getView().message = "This is a message for you!";
			callback();
		};
	};
	
}(jQuery));
