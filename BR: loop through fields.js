(function executeRule(current, previous /*null when async*/ ) {

    var amdb = new GlideRecord('u_amdb_server_export'); //make table dynamic by pulling the field from a custom field/column

    //query and grab only 1 record from the import set table so that you have a GR Object
    amdb.orderByDesc('sys_created_on');
    amdb.setLimit(1);
    amdb.query();

    //if you find an object (which you should)
    if (amdb.next()) {

        var amdbExport = new GlideRecord('u_amdb_server_export');
        amdbExport.initialize();

        //loop through all fields in the import set object		
        for (var fieldName in amdb) {

            //find custom fields to populate the fields you need to send to AMDB
            //custom fields all start with "u_"
            if (fieldName.startsWith("u_")) {
                var field2Send = fieldName.substring(2);
                // if (!gs.nil(current.getValue(field2Send))) {
                amdbExport[fieldName] = current.getValue(field2Send);
                // }
            }
        }
        amdbExport.insert();
    }

})(current, previous);
