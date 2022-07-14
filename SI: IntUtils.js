var integrationUtils = Class.create();
integrationUtils.prototype = {
    initialize: function() {

    },

    /**
     * addKA2Task Function adds a knowledge article to a task using the baseline M2M Table
     * 
     * @param {String} ka_sys_id Sys ID of KB article to add to task
     * @param {String} task_sys_id Sys ID of Task to add KB Article to
     */
    addKA2Task: function(ka_sys_id, task_sys_id) {

        try {
            //add a new record on the m2m table using the supplied record sys_ids
            var m2m = new GlideRecord('m2m_kb_task');
            m2m.initialize();
            m2m.kb_knowledge = ka_sys_id;
            m2m.task = task_sys_id;
            m2m.insert();
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'addKA2Task', ka_sys_id, task_sys_id, err);
        }
    },

    /**
     * addTag Function will take in the name of a tag and a GlideRecord object, and then add that tag to the record
     * 
     * @param {String} tagName - Name of the tag to add to a record
     * @param {GlideRecord} targetRecord - GlideRecord Object of record to add tag to
     */
    addTag: function(tagName, targetRecord) {
        try {
            //query the Tag [label] table to find the tag
            var tag = new GlideRecord('label');
            if (tag.get('name', tagName)) {

                //if the tag is found, create a record to relate this record to the tag
                var tagEntry = new GlideRecord('label_entry');
                tagEntry.intialize();
                tagEntry.label = tag.getValue('sys_id');
                tagEntry.table = targetRecord.getTableName();
                tagEntry.table_key = targetRecord.getValue('sys_id');
                tagEntry.title = targetRecord.getTableName() + " - " + targetRecord.getValue('number');

                //check to see if insert failed
                if (gs.nil(tagEntry.insert())) {

                    //create a log message if insert failed
                    gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                        this.type + '', 'addTag', tagName, targetRecord.getValue('number'),
                        'Tag insert was not successful');
                }
            }

            //if tag can't be found
            else {
                //create a log message if tag could not be found
                gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                    this.type + '', 'addTag', tagName, targetRecord.getValue('number'),
                    'Tag:' + tagName + ' could not be found');
            }
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'addTag', tagName, targetRecord.getValue('number'), err);
        }

    },

    /**
     * accountExp Function will take in the ldap date/time stamp
	  and checks to see if it is within the time range to warn users of account expirations
     * 
     * @param {String} ldapTime - Date/Time Stamp from Active Directory
     * 
	 * @returns {String} Number of days as a string of a match is found, "none" if no match is found
     */
    accountExp: function(ldapTime) {
        try {
            //pull the system property for days in future to send emails
            //initial value = ""-1,-2,-3,-4,-5,-10,-15"
            var daysOutSysProp = gs.getProperty("ngc.ldap.account_expiration.days");

            //convert ldap time to milliseconds
            var gdt = new GlideDate();
            gdt.setNumericValue((ldapTime - 116444736000000000) / 10000);

            //set milliseconds to a variable
            var acctExp = gdt.getNumericValue();

            //convert our system property to an array
            var warningDays = daysOutSysProp.split(',');

            //loop through the days and see if there is a hit
            for (i = 0; i < warningDays.length; i++) {

                //get the numeric value for days away from today
                var daysfromNow = parseInt(warningDays[i]);

                //create new Date/Time Object and set to number of days out
                var then = new GlideDateTime(gs.daysAgo(daysfromNow));

                //get the milliseconds for days out and store to variable
                var thenMs = then.getNumericValue();

                //get one day less from days out from now
                var notDaysFromNow = daysfromNow + 1;

                //convert to Date/Time object
                var notThen = new GlideDateTime(gs.daysAgo(notDaysFromNow));

                //get the millisecond value and store as variable for comparison
                var notThenMS = notThen.getNumericValue();

                //see if account expire date is less than the number of days out
                //and greater than 1 day less
                //this will prevent notifications and such for 11,12,13,14 days out
                if (acctExp <= thenMs && acctExp > notThenMS) {

                    //return the normalized number (-15 = 15) and exit for loop
                    return (warningDays[i] * -1).toString();
                }
            }

            //if no match is found, return "none"
            return "none";
        }
        //if an error occurs
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'accountExp', ldapTime, err);
        }
    },

    /**
     * acctExpDaysOut Function will calculate 16 days from now and return the time stamp in AD format
     *  
     * @returns {String} time stamp in AD format
     */
    acctExpDaysOut: function() {
        try {
            var now = new GlideDateTime(gs.daysAgo(-16));
            var daysOut = now.getNumericValue();
            var nanoSec = daysOut * 10000;
            var ldapTime = nanoSec + 116444736000000000;
            return ldapTime.toString();
        }
        //if an error occurs
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}() encountered the following error: {2}.",
                this.type + '', 'acctExpDaysOut', err);
        }
    },

    /**
     * buildGroupRoles Function will build Group Roles for sys_group_has_role table.
     * 
     * @param {String} target_grp_sys_id - sys_id of Group that will be populated with roles
     * @param (object) sourceObj - source object from source when pulling LDAP Group Roles
     */
    buildGroupRoles: function(target_grp_sys_id, sourceObj) {
        try {
            // get user record from sys_user table
            var embeddedQuery;
            var sourceGrpRoles = sourceObj.getElement('u_extensionattribute1') + "|" + sourceObj.getElement('u_extensionattribute2') + "|" + sourceObj.getElement('u_extensionattribute3') + "|" + sourceObj.getElement('u_extensionattribute4') + "|" + sourceObj.getElement('u_extensionattribute5') + "|" + sourceObj.getElement('u_extensionattribute6') + "|" + sourceObj.getElement('u_extensionattribute7') + "|" + sourceObj.getElement('u_extensionattribute8');
            var grpRoles = sourceGrpRoles.split("|");
            for (var i = 0; i < grpRoles.length; i++) {
                if (grpRoles[i]) {
                    //Check if role already exist in sys_group_has_role otherwise create a record
                    embeddedQuery = "group=" + target_grp_sys_id + "^role.name=" + grpRoles[i];
                    var grpRecord = new GlideRecord('sys_group_has_role');
                    grpRecord.addEncodedQuery(embeddedQuery);
                    grpRecord.query();
                    if (!grpRecord.next()) {
                        grpRecord.initialize();
                        grpRecord.group = target_grp_sys_id;
                        grpRecord.role = this._getRoleSysID(grpRoles[i]);
                        //create group role recrod
                        grpRecord.insert();
                    }
                }
            }
            return;
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'buildGroupRoles', target_grp_sys_id, err.message);
        }
    },

    /**
     * getUserSysID Function will query the user table using supplied field and value and return Sys ID if found
     * 
     * @param {String} queryField Name of the field on the User table to query
     * @param {String} queryValue Value of the field on the User table to find
     * 
     * @returns {String} Sys ID for the user
     */
    getUserSysID: function(queryField, queryValue) {
        try {
            //query the user table for users
            var user_gr = new GlideRecord('sys_user');
            if (user_gr.get(queryField, queryValue)) {

                //if a match is found, return the Sys ID
                return user_gr.getValue('sys_id');
            }
        }
        //if an error occurs
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'getUserSysID', queryField, queryValue, err);
        }
    },

    /**
     *  _findAMID Function will return the name of a MID Server that is:
        • Status of "UP"
        • On the Northrgum Domain
        • Dedicated to run Integrations
     * 
     * @returns {MIDServerName}
     */
    findAMID: function() {
        try {
            //query the Many-to-Many table to find MIDs assigned to applications
            //Only return 1 result
            var mids = new GlideRecord('ecc_agent_application_m2m');
            mids.addQuery('application.name', 'Integrations');
            mids.addQuery('agent.status', 'Up');
            mids.addQuery('agent.host_name', "CONTAINS", "northgrum");
            mids.setLimit(1);
            mids.query();

            //if a MID is found, return the name
            if (mids.next()) {
                return mids.agent.name + '';
            }

            //if no match is found
            else {
                gs.warn("No MID Server was found for the IDM Token Managment Integration");
            }
        }
        //if an error occurs
        catch (err) {
            gs.error("SI:{0}().{1}() encountered the following error: {2}.",
                this.type + '', '_findAMID', err);
        }
    },

    /**
     * getUserCN Function will parse the Source field from a user record and return the CN
     * 
     * @param {String} user_source Value of the Source field on a user record
     * 
     * @returns {String} CN
     */
    getUserCN: function(user_source) {
        var cn = user_source.substring(user_source.indexOf("CN=") + 3, user_source.indexOf(","));
        return cn;
    },

    /**
     *req_RequestAPI Function will take in various parameters and submit a Request using the Cart API
     *
     * @param {String} reqFor The Sys ID of the user the request is for
     * @param {String} openBy The Sys ID of the user submitting the request
     * @param {Array} requestItems Array of JSON objects to convert to Items with Variables
     * @param {String} cartName - Name to set to the Cart (Optional)
     * @param {String} correlationID - String to set to the Correlation ID field after the request is submitted
     * 
     * @returns {JSON} Object with result, successfulItems, and failedItems
     */
    req_RequestAPI: function(reqFor, openBy, requestItems, cartName, correlationID) {

        //Create new cart and set opened_by
        //use the Service Portal (SP) Method instead of just "Cart" so that we can set the openBy
        var cart = new SPCart(cartName, openBy);

        //set requested_for on new cart
        cart.setRequestedFor(reqFor);

        //loop through all items on request message and add them to cart
        for (var itemCount = 0; itemCount < requestItems.length; itemCount++) {
            cart = this.req_buildCart(cart, requestItems[itemCount], reqFor);
        }

        //submit the request / place the order
        var submitRequest = cart.placeOrder();

        //create an object to return the request results
        var req = {};

        //see if the order is successful, and if so, build the repsonse
        if (submitRequest) {
            req.successfulItems = this.req_buildResponse(submitRequest.getValue('sys_id'), submitRequest.getValue('number'), correlationID);
        }

        //failed items is not empty, but successful items is empty
        if (!gs.nil(this.failedItems) && gs.nil(req.successfulItems)) {
            req.result = "failed";
            req.failedItems = this.failedItems;
        }

        //failed items is not empty, and successful items is not empty
        else if (!gs.nil(this.failedItems) && !gs.nil(req.successfulItems)) {
            req.result = "partial";
            req.failedItems = this.failedItems;
        }

        //failed items is  empty, and successful items is not empty
        else if (gs.nil(this.failedItems) && !gs.nil(req.successfulItems)) {
            req.result = "success";
        }

        //return the req object
        return req;
    },

    /**
     * req_buildCart Function will add an Item and its varaibles to a cart and return the updated cart
	 *
     * @param {Object} cart The cart object the Item and its variables should be added to
     * @param {JSON} item JSON Object of a Catalog Item and its Variables
		 Sample JSON: 
		 {
			"item_name": "New Hire",
			"variables": {
				"hiring_manager": "bob.barker@example.com",
				"hiring_group": "Sales and Marketing",
				"remote": "No",
				"corp_office": "100 South Charles Street, Baltimore,MD",
				"standard_package": "Yes"
			}
		}
     * @param {String} reqFor Sys ID of the Requested For user
     * 
     * @returns {Cart} Updated cart object with the item and its variables added
     */
    req_buildCart: function(cart, item, reqFor) {

        //check for item_name, if empty then skip
        if (!gs.nil(item.item_name)) {

            //query for item name supplied and set sys_id to the variable
            var itemID = "";
            try {
                var item_gr = new GlideRecord('sc_cat_item');
                item_gr.addQuery('name', item.item_name);
                item_gr.addQuery('active', true);
                item_gr.query();

                //the item is found, set it to the variable
                if (item_gr.next()) {
                    itemID = item_gr.sys_id + '';
                }
                //if the item is not found
                else {
                    //set a log message
                    gs.warn("SI:{0}().{1}() Catalog Item Query could not find item with name: {2}. This item will not be added to the request.",
                        this.type + '', 'req_buildCart', item.item_name);

                    //check to see if failed item array exists
                    if (gs.nil(this.failedItems)) {

                        //if not, create it
                        this.failedItems = [];
                    }

                    //add the failed item to the array
                    this.failedItems.push(item);

                    //return the cart for any other items.
                    return cart;
                }
            }
            //if an error occurs
            catch (err) {
                //log the error
                gs.error("SI:{0}().{1}() Catalog Item [sc_cat_item] query encountered the following error: {2}.",
                    this.type + '', 'req_buildCart', err);
            }

            //check to see if item sys_id is found
            if (!gs.nil(itemID)) {

                //add the item to the cart
                var cartItem = cart.addItem(itemID);

                //call script include to get list of variables for item
                var variables = this._req_getItemVars(itemID);

                //loop through the variable array and add variables to cartItem
                for (i = 0; i < variables.length; i++) {

                    //store Item Variable Name as a variable to use in script
                    var v_name = variables[i].name;

                    //check for variable in Item JSON body, if found set to cartItem
                    if (!gs.nil(item.variables[v_name])) {

                        //check to see if variable type is reference
                        if (variables[i].type == "8") {

                            //query the reference table to get sys_id
                            try {
                                var var_gr = new GlideRecord(variables[i].table);

                                //if we can pull the record being referenced
                                if (var_gr.get(item.variables[v_name])) {

                                    //set the variable to the sys_id pulled from the query and add to cart
                                    cart.setVariable(cartItem, v_name, var_gr.getValue('sys_id'));
                                }
                            }
                            //if an error occurs
                            catch (err) {
                                //log the error
                                gs.error("SI:{0}().{1}() Variable Reference [{2}] query encountered the following error: {3}.",
                                    this.type + '', 'req_buildCart', variables[i].table, err);
                            }
                        }

                        //if variable type is NOT reference
                        //simply set the variable to the value passed in the request
                        else {
                            cart.setVariable(cartItem, v_name, item.variables[v_name]);
                        }
                    }

                    //check to see if variable is requested for
                    else if (v_name == "v_requested_for") {
                        cart.setVariable(cartItem, v_name, reqFor);
                    }

                    //if no match is found, see if there is a default value and set it if there is
                    else if (!gs.nil(variables[i].defaultValue)) {
                        cart.setVariable(cartItem, v_name, variables[i].defaultValue);
                    }
                }
            }
        }
        //return the cart
        return cart;
    },

    /**
     *req_buildResponse Function will query the newly submitted request and build the details for items and variables in a JSON object
     *
     * @param {String} req_sys_id The Sys ID of the Request [sc_request] record
     * @param {String} req_number The number of the Request [sc_request] record
     * @param {String} corr_id The Correlation ID to set to the REQ and RITM(s)
     * 
     * @returns {JSON} REQ, RITM, and Variable Values
     */
    req_buildResponse: function(req_sys_id, req_number, corr_id) {

        //check to see if correlation id has been passed
        if (!gs.nil(corr_id)) {
            try {
                //find the request record
                var req_gr = new GlideRecord('sc_request');

                //if the record is found, update it with the correlation id
                if (req_gr.get(req_sys_id)) {
                    req_gr.setValue('correlation_id', corr_id);
                    req_gr.update();
                }
            }
            //if an error occurs
            catch (err) {
                //log the error
                gs.error("SI:{0}().{1}() Request query encountered the following error: {2}.",
                    this.type + '', 'req_buildResponse', err);
            }
        }

        //build the url base for the instance and set to a variable
        var urlBase = "https://" + gs.getProperty("instance_name") + ".servicenowservices.com/esc?id=ticket&table=";

        //set an array to hold the RITMS
        var items = [];

        try {
            //query for RITMS that have the REQ as the parent
            var ritms_gr = new GlideRecord('sc_req_item');
            ritms_gr.addQuery('request', req_sys_id);
            ritms_gr.query();

            //loop through all results
            while (ritms_gr.next()) {

                //create a blank object to hold the RITM Details
                var ritm_obj = {};

                //add number, sys_id, url, state, and variables to the RITM object
                ritm_obj.number = ritms_gr.getValue('number');
                ritm_obj.sys_id = ritms_gr.getValue('sys_id');
                ritm_obj.url = urlBase + "sc_req_item&sys_id=" + ritms_gr.getValue('sys_id');
                ritm_obj.state = ritms_gr.state.getDisplayValue();
                ritm_obj.variables = {};

                //set the RITM variables array to a variable
                var variableArray = ritms_gr.variables;

                //loop through all variables
                for (var question in variableArray) {

                    //if the variable is not empty add it (name) and it's display value (value) to the variables object
                    if (!gs.nil(variableArray[question])) {
                        ritm_obj.variables[question] = variableArray[question].getDisplayValue();
                    }
                }

                //add the RITM to the items array
                items.push(ritm_obj);

                //if correlation id is not empty
                if (!gs.nil(corr_id)) {

                    //update the RITM's correlation ID
                    ritms_gr.setValue('correlation_id', corr_id);
                    ritms_gr.update();
                }
            }
        }
        //if an error occurs
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}, {3}) encountered the following error: {4}.",
                this.type + '', 'req_buildResponse', req_sys_id, req_number, err);
        }

        //set a variable for the Request
        var reqURL = urlBase + "sc_request&sys_id=" + req_sys_id;

        //build the final JSON that will be returned
        var responseDetails = {
            "request_number": req_number,
            "request_sys_id": req_sys_id,
            "request_url": reqURL,
            "ritms": items
        };

        //return the final JSON object
        return responseDetails;
    },

    /**
     * supplierBillableFlagEval Function will take in the sys_id of a user, run an evaluation,
	   then set field "Supplier Billable Flag" on User record will to true/false
     * 
     * @param {String} user_sys_id - sys_id of user to run evaluation
	 * updated on 08/10/2020 changed owned by to assigned to , update next() to hasNext()
     */
    supplierBillableFlagEval: function(user_sys_id) {
        try {
            // get user record from sys_user table
            var supplierBillableFlag = false;
            var userRecord = new GlideRecord('sys_user');
            if (userRecord.get(user_sys_id)) {
                var vcomputerMC = gs.getProperty('ngc.ldap.computer_model_category'); // get the sys_properties record for Model Category "Computer" sys_id
                var empType = userRecord.u_employee_type.toLowerCase();
                var myID = userRecord.u_my_id;
                var ngcKBGroupName = userRecord.u_ngckbgroupname.toLowerCase();
                var samaccountname = userRecord.u_samaccountname.toLowerCase();
                var isUserActive = userRecord.active;
                var isWebService = userRecord.web_service_access_only;
                var userLDAPServer = userRecord.ldap_server;
                var domesticLDAP = gs.getProperty('ngc.ldap.domestic_server');
                //check if user is active
                if (isUserActive == false || isUserActive == 'false') {
                    supplierBillableFlag = false;
                    //check if myID is not empty, ngcKBGroupName does not end 'Casual', empType is 'employee', ngcKBGroupName ends with 'full' or 'part'
                } else if (myID && (!isWebService) && (userLDAPServer == domesticLDAP) && (!ngcKBGroupName.match(/^.*casual$/)) && (empType == 'employee') && (ngcKBGroupName.match(/^.*full$/) || (ngcKBGroupName.match(/^.*part$/)))) {
                    supplierBillableFlag = true;
                } else if ((!isWebService) && (empType.match(/^contract.*$/) || ngcKBGroupName.match(/^.*intern$/))) { //check if user is Contract/Contract Labor or Intern and has an Asset (computer)
                    var encodedQuery = "model_category=" + vcomputerMC + "^assigned_to=" + user_sys_id;
                    var gr = new GlideRecord('alm_asset');
                    gr.addEncodedQuery(encodedQuery);
                    gr.query();
                    if (gr.hasNext()) {
                        supplierBillableFlag = true;
                    } else {
                        supplierBillableFlag = false;
                    }
                }
                userRecord.u_supplier_billable_flag = supplierBillableFlag;
                userRecord.update();
                return supplierBillableFlag;
            } else {
                gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                    this.type + '', 'supplierBillableFlagEval', user_sys_id, ' could not be found');
            }
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) encountered the following error: {3}.",
                this.type + '', 'supplierBillableFlagEval', user_sys_id, err.message);
        }
    },

    /**
     * _getRoleSysID function get role's sys_id used to build Roles for Group Role sys_group_has_role table.
     *
     * @param {String} roleName Name of the role
     * @returns {String} Sys ID of the role
     */
    _getRoleSysID: function(roleName) {
        var roleSysID = "";
        var grUserRole = new GlideRecord("sys_user_role");
        grUserRole.addQuery('name', roleName);
        grUserRole.query();
        if (grUserRole.next()) {
            roleSysIDs = grUserRole.sys_id;
        }
        return roleSysIDs;
    },

    /**
     * _req_getItemVars Function will pull all variables associated with a catalog item and return basic information
     * 
     * @param {String} cat_item_id Sys ID of Catalog Item
     * 
     * @returns {JSON} Array of Variable Objects
     */
    _req_getItemVars: function(cat_item_id) {

        //Check for Variable Sets on item and add them to array if found
        var varSets = [];

        try {
            var vset_gr = new GlideRecord('io_set_item');
            vset_gr.addQuery('sc_cat_item', cat_item_id);
            vset_gr.query();
            while (vset_gr.next()) {
                varSets.push(vset_gr.variable_set + '');
            }
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) Variable Set [io_set_item] Query encountered the following error: {3}.",
                this.type + '', '_req_getItemVars', cat_item_id, err);
        }

        //create an array to set variable object to
        var varArray = [];

        try {
            //query the variable table
            var var_gr = new GlideRecord('item_option_new');

            //look for variables assigned to the item
            var var_gr_OR = var_gr.addQuery('cat_item', cat_item_id);

            //check for variables in variable sets that are assigned to item
            var_gr_OR.addOrCondition('variable_set', "IN", varSets);
            var_gr.query();
            while (var_gr.next()) {

                //convert specific GlideRecord attributes as a JSON
                var varObj = {};
                varObj.question = var_gr.getValue('question_text');
                varObj.name = var_gr.getValue('name');
                varObj.defaultValue = var_gr.getValue('default_value');
                varObj.type = var_gr.getValue('type');
                varObj.table = var_gr.getValue('reference');

                //push object into the variable array
                varArray.push(varObj);
            }
        }
        //if an error occurs during this execution
        catch (err) {
            //log the error
            gs.error("SI:{0}().{1}({2}) Variable [item_option_new] Query encountered the following error: {3}.",
                this.type + '', '_req_getItemVars', cat_item_id, err);
        }
        //return the array of objects as a string
        return varArray;
    },

    /**
     * getMobilityVariableValue Function will take in a RITM Sys ID and Variable name 
     * and will return the variable value (Default) or Display Value if 'display_value' is true
     * 
     * @param {String} ritm_sys_id  Sys ID of the Requested Item the Variables are on
     * @param {String} variable_name  Vairable Name to pull value
     * @param {Boolean} display_value  True/False do you want the variable display value
     * 
     * @returns {Variable Value} String Value (Display or stored)
     */
    getMobilityVariableValue: function(ritm_sys_id, variable_name, display_value) {

        //set return variable
        var var_value = "";

        //get the RITM
        var ritm = new GlideRecord('sc_req_item');
        if (ritm.get(ritm_sys_id)) {

            //if the display value boolean is true
            if (display_value == 'true') {
                variables = ritm.variables[variable_name].getDisplayValue();
            }
            //if variable display is false or not supplied
            else {
                variables = ritm.variables[variable_name];
            }
        }

        //return the values
        return variables;
    },
    /**
     * determineMobilityCapcode Function will take in a RITM Sys ID and Variable name 
     * and will return the variable value TBD if insert or Existing Mobile Number if Update
     * 
     * @param {String} ritm_sys_id  Sys ID of the Requested Item the Variables are on
     * @param {String} type  Variable type insert-update to pull value
     * 
     * @returns {Variable Value} String Value (Display or stored)
     */
    determineMobilityCapcode: function(ritm_sys_id, variable_name, type) {

        //set return variable
        var var_value = "";

        //get the RITM
        var ritm = new GlideRecord('sc_req_item');
        if (ritm.get(ritm_sys_id)) {

            //if the display value boolean is true
            if (type == 'update') {
                variables = ritm.variables[variable_name].getDisplayValue();
            }
            //if variable display is false or not supplied
            else {
                variables = 'TBD';
            }
        }

        //return the values
        return variables;
    },

    /**
     * getMobilityCoverage Function will take in a RITM Sys ID and two variables. Variable names 
     *  will return the variable value found on the form
     * 
     * @param {String} ritm_sys_id  Sys ID of the Requested Item the Variables are on
     * @param {String} plan  Variable name
     * @param {String} plan2  Variable name
     * 
     */

    getMobilityCoverage: function(ritm_sys_id, variable_name) {

        //set return variable
        var var_value = "";

        //get the RITM
        var ritm = new GlideRecord('sc_req_item');
        if (ritm.get(ritm_sys_id)) {

            var variables = ritm.variables.getElements();
            for (var i = 0; i < variables.length; i++) {
                var question = variables[i].getQuestion();
                if (question.getLabel() == variable_name && question.getValue() != "") {
                    //return the value
                    return question.getValue();
                }
            }
        }
    },

    /**
     * decrypt Function will take in an encrypted string and return the decrypted value
     * 
     * @param {String} password - The encrypted string
     * 
     * @returns {DecryptedString}
     */
    decrypt: function(password) {
        var Encrypter = new global.GlideEncrypter();
        return Encrypter.decrypt(password);
    },

    /**
     * determineClass Function will take in an string and return one of three possible choices
     * 
     * @param {String} path - CI classes that are extended from Hardware table, Server table, or Network Gear table start with one of the following paths. If someone were to add a new table, for example, and extende it from Server, this code will still work without issues. 
     * 
     */

    determineClass: function(path) {

        if (path.startsWith("/!!/!2/!!")) {
            return 'Network';
        } else if (path.startsWith("/!!/!2/!(/!!")) {
            return 'Server';
        } else if (path.startsWith("/!!/!2/!(")) {
            return 'PC';
        }
    },

    type: 'integrationUtils'
};
