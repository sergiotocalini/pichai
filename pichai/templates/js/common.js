function autosize_tables(selected) {
    if ( selected == null || selected === '' ) {
	var tables = $('body').find(".table-autosize");
    } else {
	var tables = $('body').find(selected);
    }
    tables.each(function(row){
	var selector = $(tables[row]).attr('id');
	selector = '#' + selector;
	$(selector).on('post-body.bs.table', function () {
	    jqlisteners();
	});
	$(selector).bootstrapTable({
            height: table_height(selector),
	});
	$(selector).bootstrapTable('resetView', {
            height: table_height(selector),
	});
    });
}
function calendar_height(calendar) {
    var parent = $(calendar).parent();
    return parent.height();
};
function table_height(table) {
    var parent = $(table).parent().parent().parent().parent();
    return parent.height();
};
function rowStyle(row, index) {
    if ( row['status'] == false ) {
    return {
        css: {"text-decoration": "line-through"}
    };
    } else {
    return {
        css: {"text-decoration": "none"}
    };
    }
}
function load_select_config_changes_currency(selection, option) {
    $(selection).prop('disabled', true);
    $.ajax({
	async: true,
	type: "GET",
	url: "{{ url_for('api_configs') }}?key=CHANGES_CURRENCY",
	success: function (e) {
	    $(selection).html("");
	    for(type in e['data']['value']) {
		var row = e['data']['value'][type];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['name'] + '" ';
		html+='data-icon="' + row['icon'] + '" ';
		html+='data-name="' + row['name'] + '" ';
		html+='data-content="<i class=\'fa fa-fw ' + row['icon'];
		html+='\'></i> ' + row['name'] + '">';
		html+=row['name'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}
function load_select_config_objects_types(selection, option) {
    $(selection).prop('disabled', true);
    $.ajax({
	async: true,
	type: "GET",
	url: "{{ url_for('api_configs') }}?key=OBJECTS_TYPES",
	success: function (e) {
	    $(selection).html("");
	    for(type in e['data']['value']) {
		var row = e['data']['value'][type];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['name'] + '" '
		html+='data-content="<i class=\'fa fa-fw '+ row['icon'];
		html+='\'></i> ' + row['name'] + '">';
		html+=row['name'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}
function load_select_config_objects_status(selection, option) {
    $(selection).prop('disabled', true);
    $.ajax({
	async: true,
	type: "GET",
	url: "{{ url_for('api_configs') }}?key=OBJECTS_STATUS",
	success: function (e) {
	    $(selection).html("");
	    for(status in e['data']['value']) {
		var row = e['data']['value'][status];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['name'] + '">';
		html+=row['name'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}
function load_select_customers(selection, option) {
    $(selection).prop('disabled', true);
    $.ajax({
	async: true,
	type: "GET",
	url: "{{ url_for('api_customers_all') }}?sort=name",
	success: function (e) {
	    $(selection).html("");
	    for(customer in e['data']) {
		var row = e['data'][customer];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['name'] + '" '
		html+='data-content="<img class=\'fa fa-fw img-circle\'';
		html+=' src=\''+ row['logo'] + '\'/> ' + row['name'] + '">';
		html+=row['name'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}
function load_select_users(selection, option) {
    $(selection).prop('disabled', true);
    var url = "{{ url_for('api_users_all') }}"
    $.ajax({
	async: true,
	type: "GET",
	url: url + "?sort=displayname&limit=false&status=1",
	success: function (e) {
	    $(selection).html("");
	    for(user in e['data']) {
		var row = e['data'][user];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['displayname'] + '" '
		html+='data-content="<img class=\'fa fa-fw img-circle\'';
		html+=' src=\''+ row['avatar'] + '\'/> ';
		html+=row['displayname'] + '">';
		html+=row['displayname'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}
function load_select_projects(selection, option) {
    $(selection).prop('disabled', true);
    $.ajax({
	async: true,
	type: "GET",
	url: "{{ url_for('api_projects_all') }}?sort=name",
	success: function (e) {
	    $(selection).html("");
	    for(project in e['data']) {
		var row = e['data'][project];
		html ='<option value="' + row['id'] + '" ';
		html+='data-tokens="' + row['name'] + '" '
		html+='data-content="<img class=\'fa fa-fw img-circle\'';
		html+=' src=\''+ row['customer']['logo'] + '\'/> ';
		html+=row['name'] + '">';
		html+=row['name'] + '</option>';
		$(selection).append(html);
	    }
	    $(selection).prop('disabled', false);
	    $(selection).selectpicker('refresh');
	},
    });
}


function PrintElem(elem) {
    var mywindow = window.open('', 'PRINT', 'height=400,width=600');
    mywindow.document.write('<html><head><title>' + document.title  + '</title>');
    mywindow.document.write('</head><body >');
    mywindow.document.write('<h1>' + document.title  + '</h1>');
    mywindow.document.write(document.getElementById(elem).innerHTML);
    mywindow.document.write('</body></html>');
    mywindow.document.close(); // necessary for IE >= 10
    mywindow.focus(); // necessary for IE >= 10*/

    mywindow.print();
    mywindow.close();
    return true;
}
