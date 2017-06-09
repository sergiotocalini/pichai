function jqlisteners_object() {
    $("#object-delete").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('id');
	    $.ajax({
		async: true,
		type: "DELETE",
		url: "{{url_for('api_objects')}}?id=" + change,
		success: function (e) {
		    window.location.href = "{{ url_for('objects') }}";
		},
	    });
	},
	placement: 'bottom',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
    $("#object-edit").unbind();
    $("#object-edit").click(function(e) {
	e.preventDefault();
	var modal = "#ModalObject";
	var obj = $(this).data('id');
	$.ajax({
	    async: true,
            type: "GET",
            url: "{{url_for('api_objects')}}?id=" + obj,
            success: function (e) {
		var data = e['data'];
		var mw_start = moment(Date.parse(data['mw_start']));
		var mw_end = moment(Date.parse(data['mw_end']));
		$(modal).find('.modal-title').html("Object: #" + data['id']);
		$(modal).find('#id').val(data['id']);
		$(modal).find('#customer').selectpicker('val', data['customer']['id']);
		$(modal).find('#status').selectpicker('val', data['status']);
		$(modal).find('#stage').selectpicker('val', data['stage']);
		$(modal).find('#url').val(data['url']);
		$(modal).find('#name').val(data['name']);
		$(modal).find('#notes').val(data['notes']);
		$(modal).find('#type').selectpicker('val', data['type']);
                $(modal).modal('show');
	    },
	});
    });
    $("#object-new").unbind();
    $("#object-new").click(function(e) {
	e.preventDefault();
	var modal = "#ModalObject";
	$(modal).find('.modal-title').html("Object: New");
        $(modal).modal('show');
    });
    $(".object-open").confirmation({
	onConfirm: function(e) {
	    var obj = $(this).attr('id');
	    window.open(
		"{{ url_for('objects') }}/" + obj,
		'_blank'
	    );
	},
	placement: 'left',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
    $("#object-save").unbind();
    $("#object-save").click(function(e) {
	e.preventDefault();
        var modal = "#ModalObject";
        var oid = $(modal).find('#id').val();
        var url = "{{ url_for('api_objects') }}";
        var tag = $(modal).find('.object-status').find('i');
	var data = {
	    'name': $(modal).find('#name').val(),
	    'url': $(modal).find('#url').val(),
	    'customer': $(modal).find('#customer').val(),
	    'type': $(modal).find('#type').val(),
	    'status': $(modal).find('#status').val(),
	    'notes': $(modal).find('#notes').val(),
	};
	console.log(data);
	var method = 'POST';
	if (oid != '') {
	    method = 'PUT';
	    url += "?id=" + oid;
	}
        tag.removeClass('fa-info');
        tag.addClass('fa-spinner fa-pulse')     
        $.ajax({
            async: true,
            url: url,
            type: method,
            data: JSON.stringify(data),
            contentType: "application/json",
            success: function(e) {
                $(modal).modal('hide');
		if ( oid != '' ) {
		    window.location.href = "{{ url_for('objects') }}/" + oid;
		} else {
		    $('table').bootstrapTable('refresh');		}
            },
            error: function(e) {
                tag.removeClass('fa-spinner fa-pulse');
                tag.addClass('fa-exclamation');
            }
        });
    });
}
function ObjectsParams(params) {
    return params
}
function ObjectsResponseHandler(res) {
    var objects_status = [];
    var objects_types = [];
    $.ajax({
	async: false,
	type: "GET",
	url: "{{url_for('api_configs_all')}}?search=OBJECTS",
	success: function (e) {
	    for (item in e['data']) {
		if (e['data'][item]['key'] == 'OBJECTS_STATUS') {
		    objects_status = e['data'][item]['value'];
		} else if (e['data'][item]['key'] == 'OBJECTS_TYPES') {
		    objects_types = e['data'][item]['value'];
		}
	    }
	},
    });
    var data = [];
    for(r in res.data) {
	var row = res.data[r];
	var status = {id: -1, name: "Unknown"};
	var type = {id: -1, name: "Unknown"};
	for (s in objects_status) {
	    if (objects_status[s]['id'] == row.status) {
		status = objects_status[s];
		break;
	    }
	}
	for (t in objects_types) {
	    if (objects_types[t]['id'] == row.type) {
		type = objects_types[t];
		break;
	    }
	}
	data.push({
	    id: row.id,
	    name: row.name,
	    status: status,
	    type: type,
	    customer: row.customer.name,
	    logo: row.customer.logo,
	    url: row.url,
	    matches: row.matches,
	});
    };
    return {
	total: res.total,
	rows: data,
    }
}
function ObjectsFormatterName(value, row) {
    var html = ""
    html += '<i class="fa fa-fw fa-cube"></i> ';
    html += row.name;
    return html;
}
function ObjectsFormatterStatus(value, row) {
    var html = ""
    html += row.status.name;
    return html;
}
function ObjectsFormatterType(value, row) {
    var html = ""
    if ( row.type.icon ) {
	html += '<i class="fa fa-fw ' + row.type.icon + '"></i> ';
    }
    html += row.type.name;
    return html;
}
function ObjectsFormatterCustomer(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.logo + '"/> ';
    html += row.customer;
    return html;
}
function ObjectsFormatterActions(value, row) {
    var html = ""
    html += '<a class="object-delete" data-toggle="confirmation" ';
    html += 'data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-trash"></i>';
    html += '</a>';
    html += '<a class="object-open" data-toggle="confirmation" ';
    html += 'data-obj="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    return html;
}
