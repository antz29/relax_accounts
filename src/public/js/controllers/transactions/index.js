// #PROVIDES: controller.transactions.index

var RA = RA || {};

(function($) {
	
	RA.Transactions.Index = function() {
		RA.Action.call(this); 
		
		this.go = function(callback) {
			callback();
		};
	
		this.postRender = function() {
			var upl = new RA.Uploader();
			$('#upload').click(function () {
				upl.start();	
			});
			$('body').delegate('.hover','mouseenter',function() {
				$(this).addClass('ui-state-hover');
			});
			$('body').delegate('.hover','mouseleave',function() {
				$(this).removeClass('ui-state-hover');
			});

		};	
	};
	
}(jQuery));
