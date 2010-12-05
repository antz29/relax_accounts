function(doc) {
	if (doc.type && doc.type == "transaction") {
		emit(doc.date,doc);
	}
}
