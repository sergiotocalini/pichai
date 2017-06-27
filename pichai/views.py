#!/usr/bin/env python
import os
import arrow
import urllib
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from functools import wraps
from flask import Flask, request, render_template, g, jsonify, json
from flask import url_for, abort, flash, redirect, session
from lib import *
#from mavapa import mavapa, get_user_data

app = Flask(__name__, instance_relative_config=True)
app.config.from_object(os.environ['APP_SETTINGS'])
app.secret_key = app.config['SECRET_KEY']
#app.register_blueprint(mavapa, url_prefix='/oauth')

if not app.config.has_key('CDN_PICHAI'):
    app.config['CDN_PICHAI'] = '%s/static' %app.config.get('APPLICATION_ROOT', '')

if app.config['DB_TYPE'] == 'mysql':
    db.bind(app.config['DB_TYPE'], host=app.config['DB_HOST'],
            port=app.config['DB_PORT'], db=app.config['DB_NAME'],
            user=app.config['DB_USER'], passwd=app.config['DB_PASS'])
    db.generate_mapping(create_tables=True)
else:
    print('Database doesn\'t tested')
    exit(0)
sql_debug(app.config.get('DB_DEBUG', False))

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = session['access_token'] if 'access_token' in session else None
        user = session['user'] if 'user' in session else None
        if access_token is None or user is None:
            return redirect(url_for('login', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def active_user(f):
    @wraps(f)
    def decorated_func(*args, **kwargs):
        if not session['user'].get('status', False):
            return redirect(url_for('unauthorized'))
        return f(*args, **kwargs)
    return decorated_func

def admin_required(f):
    @wraps(f)
    @db_session    
    def decorated_func(*args, **kwargs):
        if not session['user'].get('admin'):
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_func

@db_session
def post_login():
    user = get_data('User', userid=session['user']['id'])
    if not user:
        user = User(userid=session['user']['id'],
                    email=session['user']['email'],
                    avatar=session['user']['avatar'],
                    displayname=session['user']['displayname'])
    else:
        user.set(email=session['user']['email'],
                 avatar=session['user']['avatar'],
                 displayname=session['user']['displayname'])
    session['user']['admin'] = user.admin
    session['user']['status'] = user.status
    commit()

@app.route('/fresh_u/')
def fresh_user():
    post_login()
    return redirect(url_for('index'))

@app.before_request
@db_session
def before_request():
    refresh_user = False
    if 'access_token' not in session:
        return
    if 'last_update' not in session:
        session['last_update'] = datetime.now()
        refresh_user = True
    else:
        if (datetime.now() - session['last_update']).seconds > 60:
            refresh_user = True
            session['last_update'] = datetime.now()
    if 'user' in session and refresh_user:
        # mavapa_user = get_user_data(session)
        # if mavapa_user:
        user = get_data('User', email=session['user']['email'])
        if user:
            user.last_seen = datetime.now()
            commit()
            session['user']['displayname'] = user.displayname
            session['user']['id'] = user.id
            session['user']['title'] = user.title
            session['user']['avatar'] = user.avatar
            session['user']['admin'] = user.admin
            session['user']['status'] = user.status
        else:
            post_login()
        # else:
        #     return redirect(url_for('logout'))

@db_session
def get_data(table, **kwargs):
    if kwargs:
        return eval(table).get(**kwargs)
    else:
        return select(o for o in eval(table))
    
@app.context_processor
def custom_tools():
    def time_humanize(value):
        if isinstance(value, datetime):
            local = arrow.Arrow.fromdatetime(value)
        else:
            local = arrow.Arrow.fromdate(value)
        return local.humanize()

    def date_format(value, fmt='%d/%m/%Y', tz='UTC'):
        local = '-'
        if value:
            if isinstance(value, datetime):
                local = datetime.strftime(value, fmt)
            elif isinstance(value, timedelta):
                d = {"days": value.days}
                d['hours'], rem = divmod(value.seconds, 3600)
                d['minutes'], d['seconds'] = divmod(rem, 60)
                local = fmt.format(**d)
            else:
                local = date.strftime(value, fmt)
        return local
                
    return dict(data=get_data, ago=time_humanize, dformat=date_format)
    
@app.route('/')
@login_required
@active_user
def index():
    return render_template('index.html')

@app.route('/admin', defaults={'mod': 'general'})
@app.route('/admin/<mod>')
@login_required
@active_user
@admin_required
@db_session
def admin(mod):
    if mod == 'users':
        return render_template('admin_users.html')
    elif mod == 'modules':
        return render_template('admin_modules.html')
    elif mod == 'settings':
        return render_template('admin_settings.html')
    elif mod == 'authentication':
        return render_template('admin_authentication.html')
    elif mod == 'plugins':
        return render_template('admin_plugins.html')
    elif mod == 'information':
        return render_template('admin_information.html')
    else:
        return render_template('admin.html')

@app.route('/changes', defaults={'cid': 'list'})
@app.route('/changes/<cid>')
@login_required
@active_user
@db_session
def changes(cid):
    if cid == 'list':
        return render_template('changes.html')
    else:
        change = get_data('Change', id=cid)
        if change:
            return render_template('change.html', change=change)
    abort(404)

@app.route('/customers', defaults={'cid': 'list'})
@app.route('/customers/<cid>')
@login_required
@active_user
@db_session
def customers(cid):
    if cid == 'list':
        return render_template('customers.html')
    else:
        customer = get_data('Customer', id=cid)
        if customer:
            return render_template('customer.html', customer=customer)
    abort(404)

@app.route('/login', methods=['GET', 'POST'])
def login():
#   return redirect(url_for('mavapa.login', next=request.url))
    if not session.get('user'):
        if request.method == 'POST':
            session['user'] = {}
            session['user']['email'] = request.form['email']
            session['user']['status'] = True
            session['user']['admin'] = True
            session['access_token'] = 1231543656
            next_url = session.pop('next_url', None)
            if next_url is None:
                next_url = request.args.get("next")
                if next_url is None:
                    next_url = url_for('index')
            return redirect(urllib.unquote(next_url))
        return render_template('login.html')
    else:
        next_url = session.pop('next_url', None)
        if next_url is None:
            next_url = request.args.get("next")
            if next_url is None:
                next_url = url_for('index')
        return redirect(urllib.unquote(next_url))

@app.route('/logout')
def logout():
#    return redirect(url_for('mavapa.logout'))
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/objects', defaults={'oid': 'list'})
@app.route('/objects/<oid>')
@login_required
@active_user
@db_session
def objects(oid):
    if oid == 'list':
        return render_template('objects.html')
    else:
        obj = get_data('Object', id=oid)
        if obj:
            return render_template('object.html', obj=obj)
    abort(404)

@app.route('/profile', defaults={'userid': 'me'})
@app.route('/profile/<userid>')
@login_required
@db_session
def profile(userid):
    if userid == 'me':
        qfilter = {'id': session['user']['id']}
    else:
        qfilter = {'id': userid}
    user = get_data('User', **qfilter)
    return render_template('profile.html', user=user)

@app.route('/projects', defaults={'pid': 'list'})
@app.route('/projects/<pid>')
@login_required
@active_user
@db_session
def projects(pid):
    if pid == 'list':
        return render_template('projects.html')
    else:
        project = get_data('Project', id=pid)
        if project:
            return render_template('project.html', project=project)
    abort(404)        

@app.route('/reports')
@login_required
def reports():
    return render_template('reports.html')

@app.route('/invoices', defaults={'iid': 'list'})
@app.route('/invoices/<iid>')
@login_required
@active_user
@db_session
def invoices(iid):
    if iid == 'list':
        return render_template('invoices.html')
    else:
        invoice = get_data('Invoice', id=iid)
        if invoice:
            return render_template('invoice.html', invoice=invoice)
    abort(404)
            
@app.route('/teams', defaults={'tid': 'list'})
@app.route('/teams/<tid>')
@login_required
@active_user
@db_session
def teams(tid):
    if tid == 'list':
        return render_template('teams.html')
    else:
        team = get_data('Team', id=tid)
        if team:
            return render_template('team.html', team=team)
    abort(404)

@app.route('/unauthorized')
def unauthorized():
    if not session['user'].get('status', False):
        return render_template('unauthorized.html')
    else:
        return redirect(url_for('index'))    

@app.route('/api/calendar/objects', methods=['GET'])
@db_session
def api_calendar_objects():
    args = request.args.to_dict()
    args.setdefault('start', (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
    args.setdefault('end', (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"))
    qfilter = dict((x, args[x]) for x in args if x in ['id', 'name'])
    if request.method == 'GET':
        data = {'changes':[]}
        if qfilter:
            obj = get_data('Object', **qfilter)
            if obj:
                for i in select(c for c in Change
                                if obj in c.objects
                                and c.mw_start > datetime.strptime(args['start'], "%Y-%m-%d")
                                and c.mw_start < datetime.strptime(args['end'], "%Y-%m-%d")):
                    data['changes'].append(i.to_dict())
        return jsonify(datetime=datetime.now(), data=data)
    return jsonify(datetime=datetime.now())

@app.route('/api/calendar/projects', methods=['GET'])
@db_session
def api_calendar_projects():
    args = request.args.to_dict()
    args.setdefault('start', (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
    args.setdefault('end', (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"))
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if request.method == 'GET':
        data = {'changes':[]}
        if qfilter:
            project = get_data('Project', **qfilter)
            if project:
                for i in select(c for c in Change
                                if c.project == project
                                and c.mw_start > datetime.strptime(args['start'], "%Y-%m-%d")
                                and c.mw_start < datetime.strptime(args['end'], "%Y-%m-%d")):
                    data['changes'].append(i.to_dict())
        return jsonify(datetime=datetime.now(), data=data)
    return jsonify(datetime=datetime.now())

@app.route('/api/calendar/teams', methods=['GET'])
@db_session
def api_calendar_teams():
    args = request.args.to_dict()
    args.setdefault('start', (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
    args.setdefault('end', (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"))
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if request.method == 'GET':
        data = {'changes':[], 'meetings':[]}
        if qfilter:
            team = get_data('Team', **qfilter)
            if team:
                for i in select(c for c in Change 
                                for m in c.members 
                                if m in team.members 
                                and c.mw_start > datetime.strptime(args['start'], "%Y-%m-%d")
                                and c.mw_start < datetime.strptime(args['end'], "%Y-%m-%d")):
                    data['changes'].append(i.to_dict())

                test = {'id': 1, 'start': datetime.now(),
                        'end': datetime.now() + timedelta(hours=2), 'number': "#22"}
                for i in [test]:
                    data['meetings'].append(i)
        return jsonify(datetime=datetime.now(), data=data)
    return jsonify(datetime=datetime.now())

@app.route('/api/calendar/users', methods=['GET'])
@db_session
def api_calendar_users():
    args = request.args.to_dict()
    args.setdefault('start', (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d"))
    args.setdefault('end', (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"))
    qfilter = dict((x, args[x]) for x in args if x in ['id', 'email'])
    if request.method == 'GET':
        data = {'changes':[], 'meetings':[]}
        if qfilter:
            user = get_data('User', **qfilter)
            if user:
                for i in select(c for c in Change
                                if user in c.members
                                and c.mw_start > datetime.strptime(args['start'], "%Y-%m-%d")
                                and c.mw_start < datetime.strptime(args['end'], "%Y-%m-%d")):
                    data['changes'].append(i.to_dict())

                test = {'id': 1, 'start': datetime.now(),
                        'end': datetime.now() + timedelta(hours=2), 'number': "#22"}
                for i in [test]:
                    data['meetings'].append(i)
        return jsonify(datetime=datetime.now(), data=data)
    return jsonify(datetime=datetime.now())

@app.route('/api/changes', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_changes():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if qfilter:
        change = get_data('Change', **qfilter)
        if change:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    change.set(**content)
                    updated = True
                if args.get('member', None):
                    member = get_data('User', id=args['member'][1:])
                    if member:
                        updated = True
                        if args['member'].startswith('-'):
                            change.members.remove(member)
                        else:
                            change.members.add(member)
                if args.get('object', None):
                    obj = get_data('Object', id=args['object'][1:])
                    if obj:
                        updated = True
                        if args['object'].startswith('-'):
                            change.objects.remove(obj)
                        else:
                            change.objects.add(obj)
                if updated:
                    change.updated_on = datetime.now()
                    commit()
            elif request.method == 'DELETE':
                change.delete()
                commit()
            else:
                data = change.to_dict(related_objects=False)
                data['description'] = change.description
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        else:
            abort(404)            
    elif request.method == 'POST':
        content = request.get_json(silent=True)
        if content:
            change = Change(**content)            
            commit()
    else:
        abort(400)
    return jsonify(datetime=datetime.now(), data=[])

@app.route('/api/changes/all', methods=['GET'])
@db_session
def api_changes_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('status', None)
    args.setdefault('priority', None)
    args.setdefault('requester', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    if args['type'] == 'exclude' and (args['filter'] and args['value']):
        if args['filter'] == 'project':
            raw = select(c for c in Change if args['value'] != o.project.id)
        elif args['filter'] == 'customer':
            raw = select(c for c in Change 
                         if args['value'] != c.project.customer.id)
        elif args['filter'] == 'object':
            obj = get_data('Object', id=args['value'])
            if obj:
                raw = select(c for c in Change if obj not in c.objects)
    elif args['type'] == 'only' and (args['filter'] and args['value']):
        if args['filter'] == 'project':
            raw = select(c for c in Change 
                         if args['value'] == c.project.id)
        elif args['filter'] == 'customer':
            raw = select(c for c in Change 
                         if args['value'] == o.project.customer.id)
        elif args['filter'] == 'object':
            obj = get_data('Object', id=args['value'])
            if obj:
                raw = select(c for c in Change if obj in c.objects)
        elif args['filter'] == 'team':
            team = get_data('Team', id=args['value'])
            if team:
                raw = select(c for c in Change for m in c.members 
                             if m in team.members)
        elif args['filter'] == 'invoice':
            raw = select(c for c in Change 
                         if args['value'] == c.invoice.id)
    else:
        raw = get_data('Change')

    if args['search']:
        raw = raw.filter(lambda c: args['search'].lower() in c.title.lower()
                         or args['search'].lower() in c.number.lower())

    if args['status']:
        raw = raw.filter(lambda c: args['status'] == c.status)

    if args['priority']:
        raw = raw.filter(lambda c: args['priority'] == c.priority)

    if args['requester']:
        raw = raw.filter(lambda c: args['requester'] == c.requester.id)

    if getattr(Change, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        row = i.to_dict(related_objects=False)
        if i.project:
            only = ['id', 'name', 'logo']
            row['project'] = i.project.to_dict()
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))


@app.route('/api/configs', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_configs():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id', 'key'])
    if qfilter:
        config = get_data('Config', **qfilter)
        if config:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    config.set(**content)
                    updated = True
                if updated:
                    commit()
            elif request.method == 'DELETE':
                config.delete()
                commit()
            else:
                data = config.to_dict(related_objects=False)
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        else:
            abort(404)            
    elif request.method == 'POST':
        content = request.get_json(silent=True)
        if content:
            Config(**content)
            commit()
    else:
        abort(400)
    return jsonify(datetime=datetime.now(), data=[])

@app.route('/api/configs/all', methods=['GET'])
@db_session
def api_configs_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('status', None)
    args.setdefault('priority', None)
    args.setdefault('requester', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    raw = get_data('Config')

    if args['search']:
        raw = raw.filter(lambda c: args['search'].lower() in c.key.lower())

    if getattr(Customer, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        row = i.to_dict(related_objects=False)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))

@app.route('/api/customers', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_customers():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if qfilter:
        customer = get_data('Customer', **qfilter)
        if customer:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    customer.set(**content)
                    updated = True
                if updated:
                    commit()
            elif request.method == 'DELETE':
                customer.delete()
                commit()
            else:
                data = customer.to_dict(related_objects=False)
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        else:
            abort(404)            
    elif request.method == 'POST':
        content = request.get_json(silent=True)
        if content:
            Customer(**content)
            commit()
    else:
        abort(400)
    return jsonify(datetime=datetime.now(), data=[])

@app.route('/api/customers/all', methods=['GET'])
@db_session
def api_customers_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('status', None)
    args.setdefault('priority', None)
    args.setdefault('requester', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    raw = get_data('Customer')

    if args['search']:
        raw = raw.filter(lambda c: args['search'].lower() in c.title.lower())

    if getattr(Customer, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        row = i.to_dict(related_objects=False)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))

@app.route('/api/invoices', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_invoices():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if qfilter:
        invoice = get_data('Invoice', **qfilter)
        if invoice:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    invoice.set(**content)
                    updated = True
                if updated:
                    commit()
            elif request.method == 'DELETE':
                invoice.delete()
                commit()
            else:
                data = invoice.to_dict(related_objects=False)
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        else:
            abort(404)            
    elif request.method == 'POST':
        content = request.get_json(silent=True)
        if content:
            Invoice(**content)
            commit()
    else:
        abort(400)
    return jsonify(datetime=datetime.now(), data=[])

@app.route('/api/invoices/all', methods=['GET'])
@db_session
def api_invoices_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('status', None)
    args.setdefault('priority', None)
    args.setdefault('requester', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    raw = get_data('Invoice')

    if getattr(Invoice, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        row = i.to_dict(related_objects=False)
        row['changes'] = [c.to_dict() for c in i.changes]
        if i.issued_by:
            only_user = ['id', 'userid', 'displayname', 'email', 'avatar',
                         'status', 'title', 'created_on', 'last_seen']
            row['issued_by'] = i.issued_by.to_dict(only_user)
        if i.customer:
            only = ['id', 'name', 'logo']
            row['customer'] = i.customer.to_dict(only)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))

@app.route('/api/objects', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_objects():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id', 'name'])
    if qfilter:
        obj = get_data('Object', **qfilter)
        if obj:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    obj.set(**content)
                if args.get('change', None):
                    change = get_data('Change', id=args['change'][1:])
                    if change:
                        if args['change'].startswith('-'):
                            obj.changes.remove(change)
                        else:
                            obj.changes.add(change)
                if args.get('customer', None):
                    customer = get_data('Customer', id=args['customer'])
                    if customer:
                        obj.customer = customer
                commit()
            elif request.method == 'DELETE':
                obj.remove()
                commit()
            else:
                data = obj.to_dict(related_objects=False)
                if obj.customer:
                    only = ['id', 'name', 'logo']
                    data['customer'] = obj.customer.to_dict(only)
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        elif request.method == 'POST':
            content = request.get_json(silent=True)
            if content:
                obj = Object(**content)            
            commit()
            return redirect('%s?id=%s' % (url_for('api_objects'), obj.id))
        else:
            abort(404)            
    else:
        abort(400)

@app.route('/api/objects/all', methods=['GET'])
@db_session
def api_objects_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    if args['type'] == 'exclude' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(o for o in Object if change not in o.changes 
                             and o.customer == change.project.customer)
        elif args['filter'] == 'customer':
            raw = select(o for o in Object if args['value'] != o.customer.id)
    elif args['type'] == 'only' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(o for o in Object if change in o.changes)
        elif args['filter'] == 'customer':
            raw = select(o for o in Object if args['value'] == o.customer.id)
    elif args['type'] == 'related' and args['value']:
        obj = get_data('Object', id=args['value'])
        if obj:
            raw = select((o, count(c))
                         for c in Change 
                         if obj in c.objects
                         for o in c.objects if o != obj).order_by(-2)
    else:
        raw = select(o for o in Object)

    if args['search']:
        raw = raw.filter(lambda o: args['search'].lower() in o.name.lower())

    if getattr(Object, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        if not args['type'] == 'related':
            row = i.to_dict(related_objects=False)
            if i.customer:
                only = ['id', 'name', 'logo']
                row['customer'] = i.customer.to_dict(only)
        else:
            row = i[0].to_dict(related_objects=False)
            row['matches'] = i[1]
            if i[0].customer:
                only = ['id', 'name', 'logo']
                row['customer'] = i[0].customer.to_dict(only)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))

@app.route('/api/projects', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_projects():
    yes = ["yes", "true", "t", "1"]
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id'])
    if qfilter:
        project = get_data('Project', **qfilter)
        if project:
            data = []
            if request.method == 'PUT':
                content = request.get_json(silent=True)
                if content:
                    project.set(**content)
                    updated = True
                if args.get('member', None):
                    member = get_data('User', id=args['member'][1:])
                    if member:
                        updated = True
                        if args['member'].startswith('-'):
                            project.members.remove(member)
                        else:
                            project.members.add(member)
                if updated:
                    project.updated_on = datetime.now()
                    commit()
            elif request.method == 'DELETE':
                project.delete()
                commit()
            else:
                data = project.to_dict(related_objects=False)
                return jsonify(datetime=datetime.now(), data=data)
            return jsonify(datetime=datetime.now(), data=data)
        else:
            abort(404)            
    elif request.method == 'POST':
        content = request.get_json(silent=True)
        if content:
            change = Project(**content)
            commit()
    else:
        abort(400)
    return jsonify(datetime=datetime.now(), data=[])

@app.route('/api/projects/all', methods=['GET'])
@db_session
def api_projects_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'id')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    data = []
    raw = []
    if args['type'] == 'exclude' and (args['filter'] and args['value']):
        if args['filter'] == 'customer':
            raw = select(p for p in Project 
                         if args['value'] != p.customer.id)
    elif args['type'] == 'only' and (args['filter'] and args['value']):
        if args['filter'] == 'customer':
            raw = select(p for p in Project 
                         if args['value'] == p.customer.id)
    else:
        raw = get_data('Project')

    if args['search']:
        raw = raw.filter(lambda o: args['search'].lower() in o.name.lower())

    if getattr(Project, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))
            
    for i in raw.limit(int(args['limit']), offset=int(args['offset'])):
        row = i.to_dict(related_objects=False)
        row['members'] = {'total': i.members.count()}
        row['changes'] = {'total': i.changes.count(), 'open': 0}
        if i.manager:
            only = ['id', 'userid', 'displayname', 'email', 'avatar',
                    'status', 'title', 'created_on', 'last_seen']
            row['manager'] = i.manager.to_dict(only)
        if i.customer:
            only = ['id', 'name', 'logo']
            row['customer'] = i.customer.to_dict(only)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=count(raw))


@app.route('/api/teams', methods=['GET', 'POST', 'DELETE', 'PUT'])
@db_session
def api_teams():
    args = request.args.to_dict()
    qfilter = dict((x, args[x]) for x in args if x in ['id', 'name'])
    if request.method == 'GET':
        data = []
        if qfilter:
            teams = get_data('Team', **qfilter)
            if teams:
                data.append(teams.to_dict())
        else:
            teams = get_data('Team')
            for i in teams:
                data.append(i.to_dict())
        return jsonify(datetime=datetime.now(), data=data)
    return jsonify(datetime=datetime.now())

@app.route('/api/teams/all', methods=['GET'])
@db_session
def api_teams_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'name')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    args.setdefault('status', None)
    only_user = ['id', 'userid', 'displayname', 'email', 'avatar',
                 'status', 'title', 'created_on', 'last_seen']
    only_team = ['id', 'name', 'description', 'mobile', 'avatar']
    data = []
    raw = []
    if args['type'] == 'exclude' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(o for o in User if change not in o.changes)
        elif args['filter'] == 'team':
            raw = select(o for o in User if args['value'] != o.team.id)
        elif args['filter'] == 'project':
            project = get_data('Project', id=args['value'])
            if project:
                raw = select(o for o in User 
                             if project not in o.projects_member)
    elif args['type'] == 'only' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(o for o in User if change in o.changes)
        elif args['filter'] == 'team':
            raw = select(o for o in User if args['value'] == o.team.id)
        elif args['filter'] == 'project':
            project = get_data('Project', id=args['value'])
            if project:
                raw = select(o for o in User if project in o.projects_member)
    else:
        raw = get_data('Team')

    if args['search']:
        raw = raw.filter(lambda o: args['search'].lower() in o.name.lower())

    if args['status']:
        raw = raw.filter(lambda o: args['status'] == o.status)

    if getattr(Team, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))

    total = count(raw)
    if args['limit'] not in ["no", "false", "f", "-1", "None"]:
        raw = raw.limit(int(args['limit']), offset=int(args['offset'])) 
            
    for i in raw:
        row = i.to_dict(related_objects=False)
        row['members'] = [m.to_dict(only_user) for m in i.members]
        if i.manager:
            row['manager'] = i.manager.to_dict(only_user)
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=total)

@app.route('/api/users', methods=['GET', 'POST'])
@db_session
def api_users():
    if request.method == 'GET':
        args = request.args.to_dict()
        qfilter = dict((x, args[x]) for x in args if x in ['id', 'email'])
        if qfilter:
            user = get_data('User', **qfilter)
            if user:
                data = [user.to_dict(exclude="password")]
                return jsonify(datetime=datetime.now(), data=data)
    elif request.method == 'POST':
        args = request.args.to_dict()
        qfilter = dict((x, args[x]) for x in args if x in ['id', 'email'])
        if qfilter:
            user = get_data('User', **qfilter)
            if user:
                content = request.get_json(silent=True)
                user.set(**content)
                commit()
        else:
            abort(400)
    return jsonify(datetime=datetime.now())

@app.route('/api/users/all', methods=['GET'])
@db_session
def api_users_all():
    args = request.args.to_dict()
    args.setdefault('type', None)
    args.setdefault('filter', None)
    args.setdefault('sort', 'name')
    args.setdefault('order', 'asc')
    args.setdefault('search', None)
    args.setdefault('offset', 0)
    args.setdefault('limit', 50)
    args.setdefault('status', None)
    only_user = ['id', 'userid', 'displayname', 'email', 'avatar',
                 'status', 'title', 'created_on', 'last_seen']
    only_team = ['id', 'name', 'description', 'mobile', 'avatar']
    data = []
    raw = []
    if args['type'] == 'exclude' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(u for u in User if change not in u.changes)
        elif args['filter'] == 'team':
            raw = select(u for u in User if args['value'] != u.team.id)
        elif args['filter'] == 'project':
            project = get_data('Project', id=args['value'])
            if project:
                raw = select(u for u in User if u not in project.members)
    elif args['type'] == 'only' and (args['filter'] and args['value']):
        if args['filter'] == 'change':
            change = get_data('Change', id=args['value'])
            if change:
                raw = select(u for u in User if change in u.changes)
        elif args['filter'] == 'team':
            raw = select(o for o in User if args['value'] == o.team.id)
        elif args['filter'] == 'project':
            project = get_data('Project', id=args['value'])
            if project:
                raw = select(u for u in User if u in project.members)
    else:
        raw = get_data('User')

    if args['search']:
        raw = raw.filter(lambda o: 
                         args['search'].lower() in o.displayname.lower())

    if args['status']:
        raw = raw.filter(lambda o: args['status'] == o.status)

    if getattr(User, args['sort'], None):
        if args['order'] == 'desc':
            raw = raw.order_by(lambda o: desc(getattr(o, args['sort'])))
        else:
            raw = raw.order_by(lambda o: getattr(o, args['sort']))

    total = count(raw)
    if args['limit'] not in ["no", "false", "f", "-1", "None"]:
        raw = raw.limit(int(args['limit']), offset=int(args['offset'])) 
            
    for i in raw:
        row = i.to_dict(related_objects=False)
        if args['filter'] != 'team' and i.team:
            team = i.team.to_dict(only_team)
            team['manager'] = i.team.manager.to_dict(only_user)
            row['team'] = team
        data.append(row)
    return jsonify(datetime=datetime.now(), data=data, total=total)

if __name__ == "__main__":
    app.run('0.0.0.0', 7006)
