var RA = RA || {};

(function($) {
	
	RA.OfxParser = function(data) {
		
		var valid = true;
		var accid = false;		
		var trans = [];
		
		this.accid = false;
			
		this.parse = function(callback) {
			
			function parseAccId() {
				var re = /\<ACCTID\>([^\<]*)/i;
				var id = _.trim(re.exec(data).pop());
				
				re = /\<BANKID\>([^\<]*)/i;			
				var bankid = re.exec(data);
				if (bankid && bankid[1]) {
					id = _.trim(bankid[1]) + ':' + id;
				}
				
				return id;
			};
			
			function parseTag(text,tag) {
				var re = new RegExp( "\<" + tag + "\>([^\<]*)", "i" );
				var match = re.exec(text);
				if (match) {
					return _.trim(match.pop());
				} 
				else {
					return false;
				}
			}
			
			function parseTrans(trans) {
				var t = new RA.Transaction();
			
				var dte = parseTag(trans,'dtposted');

				t.setUid(accid + parseTag(trans,'fitid'));
				t.setMethod(parseTag(trans,'trntype'));
				t.setDate(dte.substr(0,4),dte.substr(4,2),dte.substr(6,2));
				t.setValue(parseTag(trans,'trnamt'));
				t.setPayee(parseTag(trans,'name').replace('&amp;','&'));

				var memo = parseTag(trans,'memo');
				if (memo) {
					t.setDescription(memo.replace('&amp;','&'));
				}
				
				return t;
			}
			
			data = data.replace(new RegExp( "[\\r\\n]", "gi" ),'');
			accid = parseAccId();
			
			if (!accid) { 
				valid = false;
				return callback(this);
			}
			
			var re = /<STMTTRN>(.*?)<\/STMTTRN>/ig;
			var trn = data.match(re);
			
			_.each(trn, function(t){
				var tr = parseTrans(t);
				if (tr.validate()) {
					trans.push(tr);
				}
			});  
			
			callback(this);
		};
		
		this.getAccId = function() {
			return accid;
		};
	
		this.getRawTrans = function() {
			var out = [];
			_.each(trans, function(t) {
				out.push(t.transaction);
			});
			return out;
		};
	
		this.getTrans = function() {
			return trans;
		};
		
		this.isValid = function() {
			return valid;
		};
		
		this.deleteByUid = function(uid) {
			_.each(trans, function(t,i) {
				if (t.getUid() == uid) delete trans[i];
			}); 
		};
	};
	
}(jQuery));
