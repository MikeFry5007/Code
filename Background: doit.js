var user = new GlideRecord('sys_user');
user.addQuery('ldap_server','!=', 'NULL');
user.query();

if(user.next())
{
user.delete();
}


doit("sys_user");

function doit(table) {
  var gr = new GlideRecord(table);
gr.addEncodedQuery('ldap_serverISNOTEMPTY');
  gr.query();
  gr.setWorkflow(false);
  gr.deleteMultiple();
}
