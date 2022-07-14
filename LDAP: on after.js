    //get memberof and convert to lower case
    var memberof = source.u_memberof.toLowerCase();

    //if memberof is not empty and samaccountname doesn't contain snlvl1 continue
    if (!memberof.nil() && source.u_samaccountname.indexOf("snlvl1") == -1) {

        //member looks like this: CN=SnLvl2 IFS ITIL,OU=ServiceNow,OU=Groups,DC=northgrum,DC=com
        // find the first , - so memberOfv2 will equal CN=SnLvl2 IFS ITIL in our example
        var memberOfv2 = memberof.indexOf(",");
        //remove the first 3 characters, so we're left with SnLvl2 IFS ITIL
        var parent = memberof.slice(3, memberOfv2);
        //get the memberof of CN and use it to query the sys user group table to return the parent of the non-SnLvl1 group
        if (!parent.nil()) {
            var parentName = "";
            var group = new GlideRecord("sys_user_group");
            group.addQuery("u_samaccountname", 'CONTAINS', parent);
            group.addActiveQuery();
            group.query();

            if (group.next()) {
                target.parent = group.sys_id;
                target.update();
            }
        }
    }LD
