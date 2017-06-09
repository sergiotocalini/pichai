function jqlisteners_change() {
    $("#change-delete").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    $.ajax({
		async: true,
		type: "DELETE",
		url: "{{url_for('api_changes')}}?id=" + change,
		success: function (e) {
		    window.location.href = "{{ url_for('changes') }}";
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
    $("#change-edit").unbind();
    $("#change-edit").click(function(e) {
	e.preventDefault();
	var modal = "#ModalChange";
	var change = $(this).data('id');;
	$.ajax({
	    async: true,
            type: "GET",
            url: "{{url_for('api_changes')}}?id=" + change,
            success: function (e) {
		var data = e['data'];
		var mw_start = moment(Date.parse(data['mw_start']));
		var mw_end = moment(Date.parse(data['mw_end']));
		$(modal).find('.modal-title').html("Change: #" + data['id']);
		$(modal).find('#id').val(data['id']);
		$(modal).find('#project').selectpicker('val', data['project']);
		$(modal).find('#mw_start').data('DateTimePicker').date(mw_start);
		$(modal).find('#mw_end').data('DateTimePicker').date(mw_end);
		$(modal).find('#requester').selectpicker('val', data['requester']);
		$(modal).find('#reference').val(data['number']);
		$(modal).find('#url').val(data['url']);
		$(modal).find('#title').val(data['title']);
		$(modal).find('#description').val(data['description']);
		$(modal).find('#priority').val(data['priority']);
		$(modal).find('#status').val(data['status']);
                $(modal).modal('show');
	    },
	});
    });
    $("#change-new").unbind();
    $("#change-new").click(function(e) {
	e.preventDefault();
	var modal = "#ModalChange";
	$(modal).find('.modal-title').html("Change: New");
        $(modal).modal('show');
    });
    $(".change-open").confirmation({
	onConfirm: function(e) {
	    var change = $(this).attr('chg');
	    window.open(
		"{{ url_for('changes') }}/" + change,
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
    $("#change-save").unbind();
    $("#change-save").click(function(e) {
	e.preventDefault();
        var modal = "#ModalChange";
        var cid = $(modal).find('#id').val();
        var url = "{{ url_for('api_changes') }}";
        var tag = $(modal).find('.change-status').find('i');
	var data = {
	    'title': $(modal).find('#title').val(),
	    'description': $(modal).find('#description').val(),
	    'number': $(modal).find('#reference').val(),
	    'url': $(modal).find('#url').val(),
	    'requester': $(modal).find('#requester').val(),
	    'project': $(modal).find('#project').val(),
	    'status': $(modal).find('#status').val(),
	    'mw_start': $(modal).find('#mw_start').val(),
	    'mw_end': $(modal).find('#mw_end').val(),
	    'rate': $(modal).find('#rate').val(),
	};
	console.log(data);
	var method = 'POST';
	if (cid != '') {
	    method = 'PUT';
	    url += "?id=" + cid;
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
		if ( cid != '' ) {
		    window.location.href = "{{ url_for('changes') }}/" + cid;
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
