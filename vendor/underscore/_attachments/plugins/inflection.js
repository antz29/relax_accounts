_.mixin({
	camelize : function (string,lowercase)
	{
		var str = string.toLowerCase();
		var str_path = str.split('/');
		
		for(var i = 0; i < str_path.length; i++)
		{
			var str_arr = str_path[i].split('_');
			var initX = ( (lowercase && i + 1 == str_path.length ) ? (1) : (0) );
			for (var x = initX; x < str_arr.length; x++) {
				str_arr[x] = str_arr[x].charAt(0).toUpperCase() + str_arr[x].substring(1);
			}
			str_path[i] = str_arr.join('');
		}
		
		str = str_path.join('::');
		
		return str;	
	},
	underscore : function(string)
	{
		var str = string;
		var str_path = str.split('::');
		var upCase = new RegExp('([ABCDEFGHIJKLMNOPQRSTUVWXYZ])','g');
		var fb = new RegExp('^_');
		
		for (var i = 0; i < str_path.length; i++) {
			str_path[i] = str_path[i].replace(upCase, '_$1').replace(fb,'');
		}			
		
		str = str_path.join('/').toLowerCase();
		
		return str;
	}
});