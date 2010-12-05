function(doc) {
	if (doc.type && doc.type == "schedule") {
		emit(doc._id,doc);
	}
}
