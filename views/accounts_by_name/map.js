function(doc) {
	if (doc.type && doc.type == "account") {
		emit(doc.name,doc);
	}
}