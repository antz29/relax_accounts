function(doc) {
	if (doc.type && doc.type == "account") {
		emit([doc.account_type,doc.name],doc);
	}
}
