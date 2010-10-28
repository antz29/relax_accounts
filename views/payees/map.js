function (doc) {
    if (doc.type && doc.type == 'transaction') {
        if (doc.payee) emit(doc.payee,1);
        if (doc.split) doc.split.map(function (spl) {
            if (spl.payee) emit(spl.payee,1);
        });
    }
}