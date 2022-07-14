function onChange(control, oldValue, newValue, isLoading, isTemplate) {
    if (newValue === '') {
        g_form.setValue('assignment_group', g_scratchpad.prbAssignmentGroup);
		return;
    }

    var ciSupportGroup = g_form.getReference('cmdb_ci', getCISupportGroup);

}

function getCISupportGroup(ciSupportGroup, newValue) { // reference is passed into callback as first arguments

    //Set Assignment group to 'Operations SMO Problem Mgmt' if the CI does not have a defined support group
    try {
        if (ciSupportGroup.support_group != '') { //Set the assignment group to the CI support group
            g_form.setValue('assignment_group', ciSupportGroup.support_group);
        } else { //Set the CI to the Problem Mgmt group
            g_form.setValue('assignment_group', g_scratchpad.prbAssignmentGroup);
        }
    } catch (err) { //Ensure problem is assigned to the Problem Mgmt group and log error
        g_form.setValue('assignment_group', g_scratchpad.prbAssignmentGroup);
    }
}
