function jqlisteners_invoice() {
    $("#invoice-print").confirmation({
	onConfirm: function(e) {
	    window.print();
	},
	placement: 'bottom',
	btnOkLabel: 'Yes',
	btnOkClass: 'btn btn-sm btn-primary',
	btnOkIcon: 'fa fa-fw fa-check',
	btnCancelLabel: 'No',
	btnCancelClass: 'btn btn-sm btn-danger',
	btnCancelIcon: 'fa fa-fw fa-remove',
    });
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
function InvoicesParams(params) {
    return params
}
function InvoicesResponseHandler(res) {
    var data = [];
    for(r in res.data) {
	var row = res.data[r];
	data.push({
	    id: row.id,
	    customer: row.customer.name,
	    customer_logo: row.customer.logo,
	    issued_by_name: row.issued_by.displayname,
	    issued_by_avatar: row.issued_by.avatar,
	    issued_on: row.issued_on,
	    paid: row.paid,
	});
    };
    return {
	total: res.total,
	rows: data,
    }
}
function InvoicesFormatterID(value, row) {
    var html = ""
    html += '<a href="{{ url_for("invoices") }}/' + row.id + '">';
    html += row.id;
    html += '</a>';
    return html;
}
function InvoicesFormatterDate(value, row) {
    return moment(Date.parse(value)).format("YYYY-MM-DD");
}
function InvoicesFormatterIssuedBy(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.issued_by_avatar + '"/> ';
    html += row.issued_by_name;
    return html;
}
function InvoicesFormatterCustomer(value, row) {
    var html = ""
    html += '<img class="fa fa-fw img-circle" src="';
    html += row.customer_logo + '"/> ';
    html += row.customer;
    return html;
}
function InvoicesFormatterPaid(value, row) {
    var html = ""
    if ( value == false ) {
	html += '<i class="fa fa-fw fa-ban"></i>';
    } else {
	html += '<i class="fa fa-fw fa-check"></i>';
    }
    return html;
}
function InvoicesFormatterActions(value, row) {
    var html = ""
    html += '<a class="invoice-open" data-toggle="confirmation" ';
    html += 'data-inv="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-search"></i>';
    html += '</a>';
    html += '<a class="invoice-print" data-toggle="confirmation" ';
    html += 'data-inv="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-print"></i>';
    html += '</a>';
    html += '<a class="invoice-edit" data-toggle="confirmation" ';
    html += 'data-inv="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-pencil"></i>';
    html += '</a>';
    html += '<a class="invoice-delete" data-toggle="confirmation" ';
    html += 'data-inv="' + row.id + '" href="#">';
    html += '<i class="fa fa-fw fa-trash"></i>';
    html += '</a>';
    return html;
}
function InvoicesDetailFormatter(index, row) {
    html ='<div class="table-detail-row list-group-item row">'
    html+=' <a class="table-detail-link" href="{{ url_for("invoices") }}/';
    html+=  row['id'] + '"></a>';
    html+=' <div class="col-md-2">';
    html+='<img class="img-circle" src="' + row['customer_logo'] + '" ';
    html+='style="position: relative;height:125px;left:50%;transform:translateX(-50%);padding:1%;width:125px;"/>';
    html+=' </div>';
    html+=' <div class="col-md-7">';
    html+='  <h2 class="list-group-item-heading">' + row['id'] + '</h2>';
    html+='  <p class="list-group-item-text">' + row['notes'] + '</p>';
    html+=' </div>';
    html+=' <div class="col-md-3 text-center">';
    html+='  <h4 style="margin:3%;">';
    html+=    row['issued_on'];
    html+='  </h4>';
    html+='  <h4 style="margin:2%;">';
    html+=    0 + ' <small>Projects</small>';
    html+='  </h4>';
    html+='  <h4 style="margin: 2%;">';
    html+=    0 + ' <small>Changes</small>';
    html+='  </h4>';
    html+=' </div>';
    html+='</div>';
    return html;
}
{% if invoice %}
function InvChgParams(params) {
    params.type = 'only';
    params.filter = 'invoice';
    params.value  = '{{ invoice.id }}';
    return params
}
function InvChgResponseHandler(res) {
    var data = [];
    for(r in res.data) {
	var row = res.data[r];
	data.push({
	    status: row.status,
	    id: row.id,
	    project: row.project.name,
	    version: row.project.version,
	    priority: row.priority,
	    reference: row.number,
	    title: row.title,
	    mw_start: row.mw_start,
	    mw_end: row.mw_end,
	    updated_on: row.updated_on,
	    rate: row.rate,
	});
    };
    return {
	total: res.total,
	rows: data,
    }
}
{% endif %}
