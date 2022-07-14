findEmptyGroups();
function findEmptyGroups() {
var myGroups = [];
var grGroup = new GlideRecord("sys_user_group");
grGroup.addEncodedQuery('u_samaccountnameNOT LIKESnLvl1^ORu_samaccountnameNOT LIKESNLvl2')
grGroup.addActiveQuery();
grGroup.orderBy("name");
grGroup.query();
while (grGroup.next()) {
var gaGroupMember = new GlideAggregate("sys_user_grmember");
gaGroupMember.addQuery("group",grGroup.sys_id.toString());
gaGroupMember.addAggregate('COUNT');
gaGroupMember.query();
var gm = 0;
if (gaGroupMember.next()) {
gm = gaGroupMember.getAggregate('COUNT');
if (gm == 0) {
//myGroups.push(grGroup.name.toString());
gs.print(grGroup.name.toString());

}
}
}
//gs.print(myGroups);
}



var myGroups = [];
var grGroup = new GlideRecord("sys_user_group");
grGroup.addQuery('u_samaccountname','DOES NOT CONTAIN', 'SnLvl1');
grGroup.addQuery('u_samaccountname','DOES NOT CONTAIN', 'SNLvl2');
grGroup.addActiveQuery();
grGroup.orderBy("name");
grGroup.query();
while (grGroup.next()) {
var gaGroupMember = new GlideAggregate("sys_user_grmember");
gaGroupMember.addQuery("group",grGroup.sys_id.toString());
gaGroupMember.addAggregate('COUNT');
gaGroupMember.query();
var gm = 0;
if (gaGroupMember.next()) {
gm = gaGroupMember.getAggregate('COUNT');
if (gm > 1 && gm <=2) {
gs.print(grGroup.name.toString());

}
}
}



