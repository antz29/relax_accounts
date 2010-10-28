//Constants
var DB = location.href.split('/_design').shift();

// Core Libs
dominoes.rule('mustache','( vendor/mustache/mustache.js > js/lib/mustache.js )');
dominoes.rule('couch','( js/lib/couch/document.js js/lib/couch/view.js )');
dominoes.rule('module','js/lib/module.js');
dominoes.rule('action','( module mustache couch ) > js/lib/action.js');
dominoes.rule('raphael','vendor/raphael/raphael.js');
dominoes.rule('codemirror','vendor/codemirror/codemirror.js');
dominoes.rule('md5','vendor/paj/md5.js');
dominoes.rule('jquery-ui','( http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/jquery-ui.min.js $css(http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.5/themes/smoothness/jquery-ui.css) )');

//jQuery Plugins
dominoes.rule('jquery.event.drag','vendor/jquery/plugins/jquery.event.drag.js');
dominoes.rule('jquery.event.drop','vendor/jquery/plugins/jquery.event.drop.js');
dominoes.rule('jquery.sparkline','vendor/jquery/plugins/jquery.sparkline.js');
dominoes.rule('jquery.caret','vendor/jquery/plugins/jquery.caret.js');

//Transaction
dominoes.rule('transaction','( md5 js/lib/transaction.js )');

//Parser
dominoes.rule('parser','js/lib/parser.js');
dominoes.rule('parser.ofx','( parser transaction js/lib/parsers/ofx.js )');

//Rules
dominoes.rule('rules_engine','js/lib/rules.js');

//Uploader
dominoes.rule('uploader','( rules_engine parser jquery-ui ) > js/lib/uploader.js');

// Application Modules
dominoes.rule('home','module > js/controllers/home.js');
dominoes.rule('home.index','action > js/controllers/home/index.js');

//Slick Grid
dominoes.rule('slickgrid','( jquery.event.drag jquery.event.drop jquery-ui ) > ( vendor/slickgrid/js/slick.columnpicker.js vendor/slickgrid/js/slick.editors.js vendor/slickgrid/js/slick.grid.js vendor/slickgrid/js/slick.model.js vendor/slickgrid/js/slick.pager.js vendor/slickgrid/js/slick.remotemodel.js $css(vendor/slickgrid/css/slick.columnpicker.css) $css(vendor/slickgrid/css/slick.grid.css) $css(vendor/slickgrid/css/slick.pager.css) )');

dominoes.rule('accounts','module > js/controllers/accounts.js');
dominoes.rule('schedule','module > js/controllers/schedule.js');
dominoes.rule('budget','module > js/controllers/budget.js');

dominoes.rule('transactions','module > js/controllers/transactions.js');
dominoes.rule('transactions.index','( uploader action ) > js/controllers/transactions/index.js');
dominoes.rule('transactions.upload','( parser action rules_engine slickgrid jquery.caret ) > js/controllers/transactions/upload.js');
dominoes.rule('transactions.rules','( action codemirror ) > js/controllers/transactions/rules.js');

// Other Global Stuff
$('input').live('change',function() {
	if ($(this).hasClass('money')) {
		$(this).val((Math.round($(this).val() * 100)/100).toFixed(2));
		$(this).data('value',Math.round($(this).val() * 100));
	}
	else if ($(this).hasClass('int')) {
		$(this).val(Math.round($(this).val()));
		$(this).data('value',Math.round($(this).val()));
	}
});
