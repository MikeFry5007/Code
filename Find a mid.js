(function execute(inputs, outputs) {

    var ds = new GlideRecord('sys_data_source');
    ds.get(inputs.ds_sys_id);

    var mid = findAMID();

    if (mid.toLowerCase().indexOf("error") > -1) {
        current.setValue('u_httpstatus', 500);
        current.setValue('u_errorcode', "ERROR");
        current.setValue('u_errormsg', "No MID with Status = 'UP' was found.");
    } else {
        var jdbc = new JDBCProbe(ds.mid_server.name + '');
        jdbc.setDriver('com.microsoft.sqlserver.jdbc.SQLServerDriver');
        jdbc.setName(ds.getValue('name'));
        jdbc.setDataSource(ds.getValue('sys_id'));

        //if inputs.tableName is empty, use the Data Source table name
        if (gs.nil(inputs.tableName)) {
            jdbc.setTable(ds.getValue('table_name'));
        } else {
            jdbc.setTable(inputs.tableName);
        }

        jdbc.setFunction('insert');
        jdbc.setConnectionString(connectionString(ds));

        var fields = JSON.parse(inputs.fields);

        if (Array.isArray(fields)) {

            for (var i = 0; i < fields.length; i++) {
                jdbc.addField(fields[i].name, fields[i].value);
            }
        } else {
            for (var element in fields) {
                jdbc.addField(element, fields[element]);
            }
        }

        outputs.ecc_queue_sys_id = jdbc.create();
    }

    function connectionString(ds_gr) {
        var Encrypter = new global.GlideEncrypter();
        var connectString = "jdbc:sqlserver://";
        connectString += ds_gr.getValue('jdbc_server');
        connectString += ";user=";
        connectString += ds_gr.getValue('jdbc_user_name');
        connectString += ";password=";
        connectString += Encrypter.decrypt(ds_gr.jdbc_password);
        connectString += ";";
        return connectString;
    }

    function findAMID() {
        var mids = new GlideRecord('ecc_agent_application_m2m');
        mids.addQuery('application.name', 'Integrations');
        mids.addQuery('agent.status', 'Up');
        mids.setLimit(1);
        mids.query();
        if (mids.next()) {
            return mids.agent.name + '';
        } else {
            return 'error: no MIDs found';
        }
    }
})(inputs, outputs);
