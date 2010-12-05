function(doc) {
	
	var tdoc = eval(uneval(doc));
		
	var makeKey = function(trans) {
		return trans.account;
	}

	var emitTrans = function(trans) {
			
		emit(makeKey(trans),trans.value);
		if (trans.transfer) {
			var ntrans = eval(uneval(trans));
			ntrans.value = ntrans.value * -1;
			ntrans.account = trans.transfer;
			ntrans.transfer = trans.account;
			emit(makeKey(ntrans),ntrans.value);
		}
	}

	if (tdoc.type && tdoc.type == "transaction") {
		if (tdoc.split) {
			var spl;
			while(spl = tdoc.split.shift()) {
				var ndoc = eval(uneval(tdoc));
				delete ndoc.split;
				for (var i in spl) {
					ndoc[i] = spl[i];
				}
				emitTrans(ndoc);	
			}			
		}
		else {
			emitTrans(tdoc);
		}		
	}
}
