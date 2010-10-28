function (doc) {
    if (doc.type && doc.type == 'transaction') {
        if (doc.category) emit(doc.category,1);
        if (doc.split) doc.split.map(function (spl) {
            if (spl.category) emit(spl.category,1);
        });
    }
}