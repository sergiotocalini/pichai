function jqlisteners_project() {
    $(".project-delete").confirmation({
	onConfirm: function(e) {
	    var proj = $(this).attr('proj');
	    $.ajax({
		async: true,
		type: "DELETE",
		url: "{{url_for('api_projects')}}?id=" + proj,
		success: function (e) {
		    $('.table').bootstrapTable('refresh');
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
    $(".project-edit").unbind();
    $(".project-edit").click(function(e) {
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
		$(modal).find('#requester').val(data['requester']);
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
    $("#project-new").unbind();
    $("#project-new").click(function(e) {
	e.preventDefault();
	var modal = "#ModalProject";
	$(modal).find('.modal-title').html("Project: New");
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
    $("#project-save").unbind();
    $("#project-save").click(function(e) {
	e.preventDefault();
        var modal = "#ModalProject";
        var pid = $(modal).find('#id').val();
        var url = "{{ url_for('api_projects') }}";
        var tag = $(modal).find('.change-status').find('i');
	var data = {
	    'name': $(modal).find('#name').val(),
	    'description': $(modal).find('#description').val(),
	    'customer': $(modal).find('#customer').val() || null,
	    'manager': $(modal).find('#manager').val() || null,
	    'date_start': $(modal).find('#date_start').val(),
	    'date_end': $(modal).find('#date_end').val(),
	    'parent': $(modal).find('#parent').val() || null,
	};
	console.log(data);
	var method = 'POST';
	if (pid != '') {
	    method = 'PUT';
	    url += "?id=" + pid;
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
		console.log(pid);
		if ( pid != '' ) {
		    window.location.href = "{{ url_for('projects') }}/" + pid;
		} else {
		    $('.table').bootstrapTable('refresh');
		}
            },
            error: function(e) {
                tag.removeClass('fa-spinner fa-pulse');
                tag.addClass('fa-exclamation');
            }
        });
    });
}
