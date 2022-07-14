// This script automatically closes incidents that are resolved
// and haven't been updated in the specified number of days.
// This number is a property in System Properties.
// To place a comment in the incident, uncomment the "gr.comments" line.

autoCloseIncidents();

function autoCloseIncidents() {
    var ps = gs.getProperty('glide.ui.autoclose.time');
    var pn = parseInt(ps);

    //Get the relative duration for 3 business days
    var relDur = 'e25184241bb99c549fb2646ce54bcb62';

    //get the incidents that we want to go through
    var encQue = 'active=true^resolved_atISNOTEMPTY';
    var gr = new GlideRecord('incident');
    gr.addEncodedQuery(encQue);
    gr.query();

    while (gr.next()) {
        
		//Calculate and see if resolve date is more than 3 business days ago. And if, close the ticket.
        var dc = new DurationCalculator();
		
        //Load the schedule into our calculation through the function below
        addSchedule(dc);
		
        //Do the calculation and see if end date is before today
        dc.setStartDateTime(gr.resolved_at);
        if (!dc.calcRelativeDuration(relDur)) {
            gs.error("*** calcRelativeDuration failed for record {0}", gr.number);
        }
        if (dc.getEndDateTime() < gs.nowDateTime()) {
            gr.setValue('state', 7);
            gr.comments = 'Incident automatically closed after ' + pn + ' business days in the Resolved state.';
            gr.update();
        }
    }

    function addSchedule(durationCalculator) {

        //   Load the "7-5 weekdays excluding holidays" schedule into our duration calculator.
        var scheduleName = "7-5 weekdays excluding holidays";
        var grSched = new GlideRecord('cmn_schedule');
        grSched.addQuery('name', scheduleName);
        grSched.query();
		
        if (!grSched.next()) {
            gs.error("*** Could not find schedule {0}.", scheduleName);
            return;
        }
        return durationCalculator.setSchedule(grSched.getUniqueValue(), "GMT");
    }
}
