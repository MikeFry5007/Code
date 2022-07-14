var catalogAjax = Class.create();
catalogAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {

    /**
     * getUserInfo - get the value of the field for a User
     * 
     * @param (String) sysparm_userID - sys_id
     * @param (String) sysparm_field - field in the table where value will be return
     * @param (String) sysparm_table - table to be used
     */
    getUserInfo: function() {

        try {
            //get parameters
            var vSysID = this.getParameter('sysparm_userID');
            var vField = this.getParameter('sysparm_field');
            var vTable = this.getParameter('sysparm_table');

            var vSector;
            var gr = new GlideRecord(vTable);
            if (gr.get(vSysID)) {
                vSector = gr.getValue(vField);
            }
            return vSector;

        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}, {4}) encountered the following error: {5}.",
                this.type + '', 'getUserInfo', vSysID, vField, vTable, err);
        }
    },

    getUserGroups: function(userID) {

        try {
            //get parameters
            if (!userID) {
                userID = this.getParameter('user');
            }
            //construct array
            var groupArray = [];

            var groupLookup = new GlideRecord('sys_user_grmember');
            groupLookup.addQuery('user', userID);
            groupLookup.query();
            while (groupLookup.next()) {
                groupArray.push(groupLookup.getValue('group'));
            }

            return groupArray + '';

        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'getUserGroups', userID, groupArray, err);
        }
    },

    getGroupsUserManages: function(userID) {

        try {
            //get parameters
            if (!userID) {
                userID = this.getParameter('user');
            }
            //construct array
            var groupArray = [];

            var groupLookup = new GlideRecord("sys_user_group");
            groupLookup.addEncodedQuery('active=true^manager=' + userID + '^NQactive=true^manager.manager=' + userID);
            groupLookup.query();
            while (groupLookup.next()) {
                groupArray.push(groupLookup.getValue('name'));
            }

            return groupArray + '';

        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'geGroupsUserManages', userID, groupArray, err);
        }
    },

    getAllGroups: function(encq) {

        try { //get parameters
            if (!encq) {
                encq = this.getParameter('encq');
            }
            //construct array
            var groupArray = [];

            var groupLookup = new GlideRecord('sys_user_group');
            groupLookup.addActiveQuery();
            if (encq) {
                groupLookup.addEncodedQuery(encq);
            }
            groupLookup.query();
            while (groupLookup.next()) {
                groupArray.push(groupLookup.getValue('sys_id'));
            }

            return groupArray;

        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'getAllGroups', groupArray, err);
        }
    },

    getDiffGroups: function(userID) {

        try {

            //get parameters
            if (!userID) {
                userID = this.getParameter('user');
            }
            var arrayUtil = new ArrayUtil();
            var myGroups = this.getUserGroups(userID);
            var myGroupArray = myGroups.split(",");
            var allGroups = this.getAllGroups();

            var groupsICanJoin = arrayUtil.diff(allGroups, myGroupArray);

            return groupsICanJoin.join();


        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'getDiffGroups', groupArray, err);
        }
    },

    //call in catalog item VTC, Webcast, or Live Event
    vtc: function() {

        // get sysid passed in from client script
        var id = this.getParameter('sysparm_sysid');
        var data = {};

        //query the RITM and return the variables
        var ritmRec = new GlideRecord("sc_req_item");
        if (ritmRec.get(id)) {
            var itemVariables = ritmRec.variables;

            //loop through all variables on the previous RITM
            for (var varName in itemVariables) {

                //if previous variables are not empty or one of the 3 below
                if (itemVariables[varName] != "" &&
                    varName != "event_setup_time" &&
                    varName != "event_start_date_time" &&
                    varName != "event_end_date_time") {

                    //push the return variables
                    data[varName] = itemVariables[varName].toString();
                }
            }
        }
        return JSON.stringify(data);
    },
    getItemVars: function() {
        //call in catalog item VTC, Webcast, or Live Event


        // get sysid passed in from client script
        var id = this.getParameter('ritmID');
        var data = {};

        //query the RITM and return the variables
        var ritmRec = new GlideRecord("sc_req_item");
        if (ritmRec.get(id)) {
            var itemVariables = ritmRec.variables;

            //loop through all variables on the previous RITM
            for (var varName in itemVariables) {

                //if previous variables are not empty
                if (itemVariables[varName] != "") {

                    //push the return variables
                    data[varName] = itemVariables[varName].toString();
                }
            }
        }
        return JSON.stringify(data);
    },

    //function to get the content of a KA and return it to the catalog item.
    getKBArticle: function(article) {

        try {
            if (!article) {
                article = this.getParameter('artID');
            }

            //receive the article requested and fetch the article record.
            var getArticle = new GlideRecord('u_kb_template_general_eeom_article');
            getArticle.get(article);
            var artTitle = getArticle.short_description;
            var artWF = getArticle.workflow_state;
            var artBody = getArticle.u_kb_article_body;

            //return the article title, workflow state and body to the catalog item script.
            return artTitle + '&&&' + artWF + '&&&' + artBody;

        } catch (err) {
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'getKBArticle', artTitle, artWF, artBody, err);
        }
    },
    //called from Mobility order guide
    //passing in UserId and Table
    getData: function() {
        try {
            //get parameters
            var vSysID = this.getParameter('sysparm_userID');
            var vTable = this.getParameter('sysparm_table');

            var json = new JSON();
            var data = {};

            var userData = new GlideRecord(vTable);
            userData.get(vSysID);
            if (userData) {
                //get Users country
                data.address = userData.location.street.getDisplayValue();
                data.city = userData.location.city.getDisplayValue();
                data.state = userData.location.state.getDisplayValue();
                data.zip = userData.location.zip.getDisplayValue();
            }
            return json.encode(data);
        } catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}, {4}) encountered the following error: {5}.",
                this.type + '', 'getData', vSysID, vField, vTable, err);
        }

    },

    getSysProperty: function(sysProperty) {

        try {

            //Get parameter
            sysProperty = this.getParameter('propertyName');

            //Retrieve and return system property
            var property = gs.getProperty(sysProperty);
            return property;

        } catch (err) {

            //Log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'getSysProperty', property, err);
        }
    },

    validateGroupMembership: function(userID) {

        try {

            //Retrieve user sys_id parameter
            if (!userID) {
                userID = this.getParameter('user');
            }

            //Retrieve system property parameter containing group sys_id's
            var property = gs.getProperty(this.getParameter('propertyName'));

            //Split property into array
            var propArray = property.split(',');

            //iterate through array to check membership for each group
            for (var i = 0; i < propArray.length; i++) {
                var isMember = gs.getUser().getUserByID(userID).isMemberOf(propArray[i]);

                //If member of the group stop the loop
                if (isMember == true) {
                    break;
                }
            }

            //Return true if member of any of the groups
            return isMember;

        } catch (err) {

            //Log the error
            gs.error("SI:{0}().{1} encountered the following error: {2}.",
                this.type + '', 'validateGroupMembership', err);
        }
    },

    getCiReferenceBySerial: function() {

        try {
            //Create variable for reference
            var ciReference = '';

            //Retrieve serial number
            var serial = this.getParameter('serialNumber').toString();

            //Query for the CI record
            var ciLookup = new GlideRecord('cmdb_ci_computer');
            ciLookup.addQuery('serial_number', serial);
            ciLookup.query();
            while (ciLookup.next()) {

                //Update the reference variable with the sys_id
                ciReference = ciLookup.getValue('sys_id');
            }

            //Return reference variable
            return ciReference;

        } catch (err) {

            //Log the error
            gs.error("SI:{0}().{1} encountered the following error: {2}.",
                this.type + '', 'getCIReferenceBySerial', err);
        }
    },
    getLocations: function() {

        //set variable to store all locations
        var locs = [];

        try {
            //query to get all locations based on requirements
            var loc = new GlideRecord('cmn_location');
            loc.addEncodedQuery('u_active=A');
            loc.query();
            while (loc.next()) {
                locs.push(loc.getValue('sys_id'));
            }
        } catch (err) {
            gs.error("SI: {0}.{1}({2}, {3}) - Has encountered the following error while querying the 'location' table: {4}",
                this.type + '', 'getLocations', err);
        }
        //return the final list of locations
        return 'sys_idIN' + locs.toString();

    },

    type: 'catalogAjax'

});
