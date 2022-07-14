    add_removeList: function(table, record_sys_id, list_field, sys_id_list, add_remove) {
        var gr = new GlideRecord(table);
        if (gr.get(record_sys_id)) {
            var returnList = [];
            var au = new ArrayUtil();
            if (add_remove == 'add') {
                returnList = au.union(gr.getValue(list_field).split(","), sys_id_list.split(","));
            } else if (add_remove == 'remove') {
                returnList = au.diff(gr.getValue(list_field).split(","), sys_id_list.split(","));
            }
            gr.setValue(list_field, returnList.join(","));
            gr.update();
        }
    },
