$(function () {
	var first_load = true;
	
	$(window).bind( 'hashchange', function (e) {
		var state = $.bbq.getState();
		if (!state.module) state.module = 'home';
		var conact = state.module.split('/');
		var controller = conact.shift();
		var action = conact.shift();
		action = action || 'index';
		
		if (!first_load) {
			var out_height = $('#main').outerHeight();
			var load_height = (out_height < 200) ? 200 : out_height;
			var load_timer = setTimeout(function() {
				$('#loading').height(load_height).show();
			},300);			
		}
		
		dominoes(controller,function () {
			var name =_.camelize(controller);
			controller = new RA[name]();
			controller.setName(name);
			
			delete state.module;
			
			controller.callAction(action,state,function(contents) {
				var class_name = _.underscore(name);
				$('nav li').removeClass('active');
				$('nav li a[href*='+ class_name +']').closest('li').addClass('active');
				$('body').removeAttr('class').addClass(class_name);
				$('#main').html(contents);
				$('#loading').fadeOut();
				first_load = false;
				clearTimeout(load_timer);
			});
		});
	});	
	
	$(window).trigger('hashchange');
});
