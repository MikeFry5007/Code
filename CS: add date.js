https://community.servicenow.com/community?id=community_question&sys_id=38c40be9dbd8dbc01dcaf3231f9619e3

function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue == '') {
        return;
    }
    var date = g_form.getValue('when_should_this_request_be_completed_by');

    var ajax = new GlideAjax('ClientDateTimeUtils');
    ajax.addParam('sysparm_name', 'getNowDate');
    ajax.getXML(doSomething);

    function doSomething(response) {
        var answer = response.responseXML.documentElement.getAttribute("answer");


        if (date < answer) {
            g_form.showErrorBox('when_should_this_request_be_completed_by', getMessage("Date cannot be in the past"));
        }
    }
}



https://community.servicenow.com/community?id=community_question&sys_id=38c40be9dbd8dbc01dcaf3231f9619e3


function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue == '') {
        return;
    }

    var input = g_form.getValue('need_by_date'); //Choose the field to add time from

    //add 3 days to the current date
    var addtime = 3; //The amount of time to add
    var addtype = 'day'; //The time type.   Can be day, week, month, year.
    var ajax2 = new GlideAjax('ClientDateTimeUtils');
    ajax2.addParam('sysparm_name', 'addDateAmountNow');
    ajax2.addParam('sysparm_addtime', addtime);
    ajax2.addParam('sysparm_addtype', addtype);
    ajax2.getXML(doSomething);




    function doSomething(response) {
        var answer = response.responseXML.documentElement.getAttribute("answer");

        //compare the current date + 3 to the date entered. If less than 3 days, show error and auto-update the date
        if (input < answer) {
            g_form.setValue('need_by_date', answer);
            g_form.showErrorBox('need_by_date', getMessage("Date automatically updated to meet 3 day minimum"));

        }
    }
}


