// #PACKAGE: controller
// #MODULE: home.index

CMVC.action("home","index",function() {	

	this.go = function(callback) {
		this.getView().message = "This is a message for you!";
		callback();
	};

});
