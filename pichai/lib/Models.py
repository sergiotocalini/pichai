#!/usr/bin/env python
from datetime import date, datetime
from pony.orm import *

db = Database()

class User(db.Entity):
    _table_ = 'users'
    id = PrimaryKey(int, auto=True)
    userid = Required(unicode, unique=True)
    displayname = Required(unicode)
    email = Required(unicode, unique=True)
    password = Optional(unicode)
    avatar = Required(unicode)
    status = Required(bool, default=False)
    admin = Required(bool, default=False)
    created_on = Required(datetime, sql_type='TIMESTAMP', 
                          sql_default='CURRENT_TIMESTAMP',
                          default=datetime.now)
    last_seen = Required(datetime, sql_type='TIMESTAMP',
                         sql_default='CURRENT_TIMESTAMP',
                         default=datetime.now)
    title = Optional(unicode)
    lang = Optional(unicode)
    tz = Optional(unicode)
    team = Optional('Team', reverse='members')
    teams_manager = Set('Team', reverse='manager', cascade_delete=False)
    projects_manager = Set('Project', reverse='manager',
                           cascade_delete=False)
    projects_member = Set('Project', reverse='members')
    customers_dpe = Set('Customer')
    changes = Set('Change', reverse='members')
    changes_watcher = Set('Change', reverse='watchers', 
                          table="change_watchers")
    feeds = Set('Feed')
    dispatchers = Set('Dispatcher')
    requests = Set('Change', reverse='requester')
    invoices = Set('Invoice')


class Config(db.Entity):
    _table_ = 'configs'
    id = PrimaryKey(int, auto=True)
    key = Required(unicode, unique=True)
    value = Required(Json)


class Project(db.Entity):
    _table_ = 'projects'
    id = PrimaryKey(int, auto=True)
    name = Required(unicode)
    description = Optional(unicode)
    date_start = Required(datetime, sql_type='TIMESTAMP',
                          sql_default='CURRENT_TIMESTAMP',
                          default=datetime.now)
    date_end = Optional(datetime, sql_type='TIMESTAMP',
                        sql_default='CURRENT_TIMESTAMP', default=datetime.now)
    progress = Required(float, default="0.0")
    notes = Optional(unicode)
    customer = Required('Customer')
    parent = Optional('Project', reverse='childs')
    childs = Set('Project', reverse='parent', cascade_delete=False)
    manager = Optional(User, reverse='projects_manager')
    members = Set(User, reverse='projects_member')
    changes = Set('Change')
    scope = Optional('Scope')
    feeds = Set('Feed')


class Change(db.Entity):
    _table_ = 'changes'
    id = PrimaryKey(int, auto=True)
    number = Required(unicode)
    title = Optional(unicode)
    description = Optional(LongUnicode)
    mw_start = Required(datetime)
    mw_end = Required(datetime)
    url = Optional(unicode)
    status = Required(int, size=8, default=0)
    priority = Required(int, size=8, default=0)
    created_on = Required(datetime, sql_type='TIMESTAMP',
                          sql_default='CURRENT_TIMESTAMP',
                          default=datetime.now)
    updated_on = Required(datetime, sql_type='TIMESTAMP',
                          sql_default='CURRENT_TIMESTAMP',
                          default=datetime.now)
    rate = Optional(Json)
    requester = Required(User, reverse='requests')
    objects = Set('Object')
    project = Required(Project)
    members = Set(User, reverse='changes')
    watchers = Set(User, reverse='changes_watcher', table="change_watchers")
    invoice = Optional('Invoice')


class Customer(db.Entity):
    _table_ = 'customers'
    id = PrimaryKey(int, auto=True)
    name = Required(unicode, unique=True)
    projects = Set(Project)
    contact = Optional(unicode)
    notes = Optional(unicode)
    logo = Optional(unicode)
    dpes = Set(User)
    objects = Set('Object')
    dispatchers = Set('Dispatcher')
    invoices = Set('Invoice')


class Object(db.Entity):
    _table_ = 'objects'
    id = PrimaryKey(int, auto=True)
    name = Required(unicode)
    type = Required(int, size=8, default=0)
    status = Required(int, size=8, default=0)
    url = Optional(unicode)
    notes = Optional(unicode)
    changes = Set(Change)
    scopes = Set('Scope')
    customer = Optional(Customer)


class Team(db.Entity):
    _table_ = 'teams'
    id = PrimaryKey(int, auto=True)
    name = Required(unicode, unique=True)
    description = Optional(unicode)
    mobile = Optional(unicode)
    notes = Optional(unicode)
    avatar = Optional(unicode)
    manager = Required(User, reverse='teams_manager')
    members = Set(User, reverse='team')
    dispatchers = Set('Dispatcher')


class Scope(db.Entity):
    _table_ = 'scopes'
    id = PrimaryKey(int, auto=True)
    progress = Optional(float, default="0.0")
    project = Required(Project)
    objects = Set(Object)


class Feed(db.Entity):
    _table_ = 'feeds'
    id = PrimaryKey(int, auto=True)
    title = Required(unicode)
    author = Required(User)
    project = Required(Project)
    created_on = Required(datetime, sql_type='TIMESTAMP',
                          sql_default='CURRENT_TIMESTAMP', 
                          default=datetime.now)
    updated_on = Required(datetime, sql_type='TIMESTAMP',
                          sql_default='CURRENT_TIMESTAMP',
                          default=datetime.now)
    message = Required(LongUnicode)


class Dispatcher(db.Entity):
    _table_ = 'dispatchers'
    id = PrimaryKey(int, auto=True)
    user = Required(User)
    customer = Required(Customer)
    team = Required(Team)


class Invoice(db.Entity):
    _table_ = 'invoices'
    id = PrimaryKey(int, auto=True)
    issued_on = Required(datetime)
    issued_by = Required(User)
    customer = Optional(Customer)
    changes = Set(Change)
    extra_desc = Optional(LongUnicode)
    extra_rate = Required(float, default=0)
    paid = Optional(bool, default=False)

