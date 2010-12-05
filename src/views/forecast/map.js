function(doc) {
	
	var tdoc = eval(uneval(doc));
	
	var nextPeriod = (function() {
		var period = 0;
		var start_date = new Date(Date.parse(tdoc.schedule.start));
		if (!doc.schedule.end) {
			var end_date = eval(uneval(start_date));
			if (tdoc.schedule.type != "once") {
				end_date.setUTCFullYear(start_date.getUTCFullYear() + 5);
			}
		}
		else {
			var end_date = new Date(Date.parse(tdoc.schedule.end));
		}

		return function() {
			if (period == 0) {
				period++;
				return start_date;	
			}
			var next_date = eval(uneval(start_date));
			var every = tdoc.schedule.every || 1;
			var periods = (period * every);
			switch (tdoc.schedule.type) {
				case "once":
					next_date.setUTCMonth(next_date.getUTCMonth() + 1);
					break;
				case "annually":
					next_date.setUTCFullYear (next_date.getUTCFullYear () + periods);
					break;
				case "monthly":					
					next_date.setUTCMonth(next_date.getUTCMonth() + periods);
					break;
				case "weekly":
					next_date.setUTCDate(next_date.getUTCDate() + (periods * 7));
					break;
				case "daily":
					next_date.setUTCDate(next_date.getUTCDate() + periods);
					break;
			}
			period++;
			
			if (next_date > end_date) return false;
			
			return next_date;
		}
	})();

	function renderTrans(date) {
		var trans = eval(uneval(tdoc));

		delete trans.schedule;
		delete trans._id;
		delete trans._rev;

		trans.date = date;

		emit([doc._id,trans.date], trans);
	}

	if (tdoc.type && tdoc.type == "schedule" && tdoc.schedule && tdoc.schedule.type) {
		var next;
		while (next = nextPeriod()) {
			renderTrans(next);
		}
	}
}
