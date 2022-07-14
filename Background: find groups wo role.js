doit();

function doit() {
    var gr = new GlideRecord('sys_user_group');
    gr.addEncodedQuery('u_samaccountnameNOT LIKEsnlvl1^u_samaccountnameNOT LIKEsnlvl2^description=Maintained via automation. Do not manually update.')
    gr.orderBy("name");
    gr.query();
    var count = 0;
    while (gr.next()) {
        var role = new GlideRecord("sys_group_has_role");
        role.addQuery("group", gr.sys_id);
        role.query();
        if (role.next()) {
            //count = count + 1;
            //gs.print("Group: " + gr.name + " has " + count + " roles");

        } else {
            count = count + 1;
            gs.print("Group: " + gr.name + " has no roles");
            gs.print(count);
        }
    }
}
