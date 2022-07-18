Hint: Will generate Case(s) for any Affected CIs Accounts with a contact of Day-To-Day Contact Telecom Manager
onClick: openDialog()
Condition: gs.hasRole('change_manager') && current.state==-2 && current.type != 'standard' && new  x_att2_attnowinc.CaseUtilChange().isCaseExistForChange(current.sys_id)

////////////////////////////////////////////////////////////////
//Client Side: Dialog box with choices
////////////////////////////////////////////////////////////////
function openDialog() {
    //disable pop-up Modal with choices
    var gm = new GlideModal('openCase');
    //Sets the dialog title
    gm.setTitle('Create Case');
    //Set up valid custom HTML to be displayed
    gm.renderWithContent('<div style="padding:15px"><p>Which notification do you want to trigger?</p><p><select name="action" id="actions" class="form-control"><option value="infrastructure" role="option">Infrastructure</option><option value="expressway" role="option">Expressway Upgrade</option><option value="datastore" role="option">Datastore Migration</option><option value="cucm" role="option">CUCM/Unity</option><option value="egw" role="option">EGW</option></select></p><div style="padding:5px;float:right"><button style="padding:5px;margin-right:10px" onclick="window.TaskAction(this.innerHTML,jQuery(\'#actions\').val())">Submit</button></div></div>');

    //We'll use the windows object to ensure our code is accessible from the modal dialog
    window.TaskAction = function(thisButton, thisAction) {

        //Close the glide modal dialog window
        gm.destroy();

        //Submit to the back-end
        var action = thisAction;
        g_form.setValue('correlation_display', thisAction);
		
        //Regular ServiceNow form submission
        gsftSubmit(null, g_form.getFormElement(), 'create_case_from_change');

    };
    return false; //prevents the form from submitting when the dialog first loads
}

////////////////////////////////////////////////////////////////
//Server Side: Dialog box with choices
////////////////////////////////////////////////////////////////
if (typeof window == 'undefined')
    updateTask(action, current);

function updateTask(action, current) {

    action.setRedirectURL(current);
    try {
        var inputs = {};
        inputs['change_gr'] = current; // GlideRecord of table: change 
        inputs['email'] = current.correlation_display; //choice selected in modal
        sn_fd.FlowAPI.startSubflow('x_att2_attnowinc.create_major_case_or_individual_cases_from_telecom_change', inputs);

    } catch (ex) {
        var message = ex.getMessage();
        gs.error(message);
    }
}
