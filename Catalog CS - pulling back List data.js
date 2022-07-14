function onChange(control, oldValue, newValue, isLoading) {

      if (isLoading || newValue == '') {
              return;
      }
      var ga = new GlideAjax('catalogUtilsClient');
      ga.addParam('sysparm_name', 'getCISectors');
      ga.addParam('sysparm_ci', g_form.getValue("device_name_lookup"));
      ga.getXML(updateCampus);
}

function updateCampus(response) {

	var answer = response.responseXML.documentElement.getAttribute("answer");
	var arr = answer.split(','); 
	g_form.setValue('sector_for_device', answer);

}

Script Includes - Client callable

	getCISectors:function() { 
	
		var buildingid = this.getParameter('sysparm_ci');
		gs.log("buildingid = " + buildingid);
		var gr = new GlideRecord('cmdb_ci');
		gr.get(buildingid); 
		
		var results = gr.u_sector;
		gs.log("results=" + results);
		return results;
	
	
	},
