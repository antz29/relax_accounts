function(doc) {
	if (doc.type && doc.type == "rule") {
		emit(doc._id,doc);
	}
}