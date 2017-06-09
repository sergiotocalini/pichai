function PrjMbrParams(params) {
    params.type   = 'only';
    params.filter = 'project';
    params.value  = '{{ project.id }}';
    return params
}
function PrjMbrResponseHandler(res) {
    var data = [];
    for(r in res.data) {
	var row = res.data[r];
	var doc = {
	    status: row.status,
	    id: row.id,
	    displayname: row.displayname,
	    user_avatar: row.avatar,
	    team: '',
	    team_avatar: '',
	    manager: '',
	    manager_avatar: '',
	};
	if(row.team != null) {
	    doc.team = row.team.name;
	    doc.team_avatar = row.team.avatar;
	    doc.manager = row.team.manager.displayname;
	    doc.manager_avatar = row.team.manager.avatar;
	};
	data.push(doc);
    };
    return {
	total: res.total,
	rows: data,
    }
}
function PrjMbrFormatterName(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.user_avatar + '"/> ';
    html += row.displayname;
    return html;
}
function PrjMbrFormatterTeam(value, row) {
    if(row.team != ''){
	var html = "";
	html += '<img class="fa fa-fw img-circle" src="';
	html += row.team_avatar + '"/> ';
	html += row.team;
    } else {
	var html = ' - ';
    }
    return html;
}
function PrjMbrFormatterManager(value, row) {
    if(row.manager != ''){
	var html = ""
	html += '<img class="fa fa-fw img-circle" src="';
	html += row.manager_avatar + '"/> ';
	html += row.manager;
    } else {
	var html = ' - ';
    }
    return html;
}
function PrjMbrFormatterActions(value, row) {
    var html = ""
    html += '<a class="prjmbr-del" data-toggle="confirmation" ';
    html += 'data-prj="{{ project.id }}" data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-trash"></i>';
    html += '</a>';
    html += '<a class="prjmbr-open" data-toggle="confirmation" ';
    html += 'data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function PrjMbrSearchParams(params) {
    params.type   = 'exclude';
    params.filter = 'project';
    params.value  = '{{ project.id }}';
    return params
}
function PrjMbrSearchFormatterActions(value, row) {
    var html = ""
    html += '<a class="prjmbr-add" data-toggle="confirmation" ';
    html += 'data-prj="{{ project.id }}" data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-plus"></i>';
    html += '</a>';
    html += '<a class="prjmbr-open" data-toggle="confirmation" ';
    html += 'data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function jqlisteners_project_member() {
    $(".prjmbr-add").confirmation({
	onConfirm: function(e) {
	    var project = $(this).attr('prj');
	    var member = $(this).attr('mbr');
	    var url = "{{ url_for('api_projects') }}?id=" + project;
	    url += "&member=+" + member;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    $('#prjmbr-table').bootstrapTable('refresh');
                    $('#prjmbr-search-table').bootstrapTable('refresh');
		},
            });
	},
	placement: 'top',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
    $(".prjmbr-del").confirmation({
	onConfirm: function(e) {
	    var project = $(this).attr('prj');
	    var member = $(this).attr('mbr');
	    var url = "{{ url_for('api_projects') }}?id=" + project;
	    url += "&member=-" + member;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    $('#prjmbr-table').bootstrapTable('refresh');
		    $('#prjmbr-search-table').bootstrapTable('refresh');
		},
            });
	},
	placement: 'top',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
    $(".prjmbr-open").confirmation({
	onConfirm: function(e) {
	    var member = $(this).attr('mbr');
	    window.open(
		"{{ url_for('profile') }}/" + member,
		'_blank');
	},
	placement: 'top',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
}
