function ChgMbrParams(params) {
    params.type   = 'only';
    params.filter = 'change';
    params.value  = '{{ change.id }}';
    return params
}
function ChgMbrResponseHandler(res) {
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
function ChgMbrFormatterName(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.user_avatar + '"/> ';
    html += row.displayname;
    return html;
}
function ChgMbrFormatterTeam(value, row) {
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
function ChgMbrFormatterManager(value, row) {
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
function ChgMbrFormatterActions(value, row) {
    var html = ""
    html += '<a class="chgmbr-del" data-toggle="confirmation" ';
    html += 'data-chg="{{ change.id }}" data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-trash"></i>';
    html += '</a>';
    html += '<a class="chgmbr-open" data-toggle="confirmation" ';
    html += 'data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function ChgMbrSearchParams(params) {
    params.type   = 'exclude';
    params.filter = 'change';
    params.value  = '{{ change.id }}';
    return params
}
function ChgMbrSearchFormatterActions(value, row) {
    var html = ""
    html += '<a class="chgmbr-add" data-toggle="confirmation" ';
    html += 'data-chg="{{ change.id }}" data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-plus"></i>';
    html += '</a>';
    html += '<a class="chgmbr-open" data-toggle="confirmation" ';
    html += 'data-mbr="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function jqlisteners_change_member() {
    $(".chgmbr-add").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    var member = $(this).attr('mbr');
	    var url = "{{ url_for('api_changes') }}?id=" + change;
	    url += "&member=+" + member;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    $('#chgmbr-table').bootstrapTable('refresh');
                    $('#chgmbr-search-table').bootstrapTable('refresh');
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
    $(".chgmbr-del").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    var member = $(this).attr('mbr');
	    var url = "{{url_for('api_changes')}}?id=" + change;
	    url += "&member=-" + member;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    $('#chgmbr-table').bootstrapTable('refresh');
		    $('#chgmbr-search-table').bootstrapTable('refresh');
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
    $(".chgmbr-open").confirmation({
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
