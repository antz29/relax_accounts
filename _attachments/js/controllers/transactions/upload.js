var RA = RA || {};

(function($) {
	
	RA.Transactions.Upload = function() {
		RA.Action.call(this); 
		
		var grid;
		var data;

		function loadFile(callback) {
			$('#statement').change(function(e) {
				var file = this.files[0];
				var reader = new FileReader();
				var type = file.name.split('.').pop();
				reader.onload = (function(e) {
					var file_data = e.target.result;
                                        RA.StatementParse(file_data, type, function(parser) {
                                        	data = parser;
                                        	if (!data.isValid()) {
                                        		$('#loading-file').text('Invalid statement format!');
                                                	$('#statement').val('').attr('disabled',false);
                                                	return;
                                        	}
                                        	callback();
                                        });
				});
				reader.readAsText(file);
			});
		};

		function renderGrid(callback) {
			var columns = [
				{id:"payee", name:"Payee", field:"payee", sortable: true, editor:TextCellEditor},
				{id:"description", name:"Description", field:"description", sortable: true},
				{id:"date", name:"Date", field:"date", sortable: true},
				{id:"method", name:"Type", field:"method", sortable: true},
				{id:"status", name:"Status", field:"status", sortable: true},
				{id:"value", name:"Value", field:"value", sortable: true} 				
			];
		
			var options = {
				enableCellNavigation: true,
            			enableColumnReorder: true,
				autoHeight: true,
				editable: true
			};
			
			grid = new Slick.Grid($("#uploads"), data.getRawTrans(), columns, options);
		};

		this.postRender = function() {
			_.queue([
				loadFile,
				renderGrid	
			]);
		};	
	};
	
}(jQuery));
