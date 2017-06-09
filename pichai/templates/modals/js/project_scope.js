function PrjScpObjParams(params) {
    params.type   = 'only';
    params.filter = 'project';
    params.value  = '{{ project.id }}';
    return params
}
function PrjScpResponseHandler(res) {
    var data = [];
    for(r in res.data) {
	var row = res.data[r];
	data.push({
	    status: row.status,
	    id: row.id,
	    name: row.name,
	    type: row.type,
	    customer: row.customer.name,
	    logo: row.customer.logo,
	    url: row.url,
	});
    };
    return {
	total: res.total,
	rows: data,
    }
}
function PrjScpFormatterName(value, row) {
    var html = ""
    if ( row.type == 'server' ) {
	html += '<i class="fa fa-fw fa-server"></i> ';
    }
    html += row.name;
    return html;
}
function PrjScpFormatterCustomer(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.logo + '"/> ';
    html += row.customer;
    return html;
}
function PrjScpFormatterActions(value, row) {
    var html = ""
    html += '<a class="chgobj-del" data-toggle="confirmation" ';
    html += 'data-prj="{{ project.id }}" data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-trash"></i>';
    html += '</a>';
    html += '<a class="chgobj-open" data-toggle="confirmation" ';
    html += 'data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function PrjScpSearchParams(params) {
    params.type   = 'exclude';
    params.filter = 'project';
    params.value  = '{{ project.id }}';
    return params
}
function PrjScpSearchFormatterActions(value, row) {
    var html = ""
    html += '<a class="chgobj-add" data-toggle="confirmation" ';
    html += 'data-prj="{{ project.id }}" data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-plus"></i>';
    html += '</a>';
    html += '<a class="chgobj-open" data-toggle="confirmation" ';
    html += 'data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
function jqlisteners_project_scope() {
    $(".chgobj-add").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    var object = $(this).attr('obj');
	    var url = "{{ url_for('api_changes') }}?id=" + change;
	    url += "&object=+" + object;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    var listdel = {'field': 'id', 'values': [object] };
		    console.log(listdel, object);
		    $('#chgobj-table').bootstrapTable('refresh');
                    $('#chgobj-search-table').bootstrapTable('refresh');
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
    $(".chgobj-del").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    var object = $(this).attr('obj');
	    var url = "{{url_for('api_changes')}}?id=" + change;
	    url += "&object=-" + object;
	    $.ajax({
		async: true,
                type: "PUT",
                url: url,
                success: function (e) {
		    $('#chgobj-table').bootstrapTable('refresh');
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
    $(".chgobj-open").confirmation({
	onConfirm: function(e) {
	    var object = $(this).attr('obj');
	    window.open(
		"{{ url_for('objects') }}/" + object,
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
